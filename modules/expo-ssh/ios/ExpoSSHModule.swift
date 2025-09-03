import ExpoModulesCore
import Foundation
import NIOCore
import NIOPosix
import NIOSSH

public class ExpoSSHModule: Module {
  private var sshClient: SSHClient?
  
  public func definition() -> ModuleDefinition {
    Name("ExpoSSH")
    
    Events("onSSHOutput", "onSSHError", "onSSHConnected", "onSSHDisconnected")
    
    AsyncFunction("connect") { (host: String, port: Int, username: String, password: String?, privateKey: String?) in
      let sshClient = try await SSHClient.connect(host: host, port: port, username: username, password: password, privateKey: privateKey)
      self.sshClient = sshClient
      self.sendEvent("onSSHConnected", ["host": host, "port": port])
    }
    
    AsyncFunction("executeCommand") { (command: String) in
      guard let sshClient = self.sshClient else {
        throw SSHError.notConnected
      }
      
      let output = try await sshClient.executeCommand(command)
      return output
    }
    
    AsyncFunction("disconnect") {
      self.sshClient?.disconnect()
      self.sshClient = nil
      self.sendEvent("onSSHDisconnected")
    }
    
    Function("isConnected") {
      return self.sshClient?.isConnected ?? false
    }
    
    View(ExpoSSHView.self)
  }
}

enum SSHError: Error, LocalizedError {
  case connectionFailed
  case authenticationFailed
  case commandFailed
  case notConnected
  case invalidHostKey
  
  var errorDescription: String? {
    switch self {
    case .connectionFailed: return "Failed to connect to SSH server"
    case .authenticationFailed: return "Authentication failed"
    case .commandFailed: return "Command execution failed"
    case .notConnected: return "Not connected to SSH server"
    case .invalidHostKey: return "Invalid host key"
    }
  }
}

class SSHClient {
  private let eventLoopGroup: MultiThreadedEventLoopGroup
  private var channel: Channel?
  private var _isConnected = false
  
  var isConnected: Bool {
    return _isConnected
  }
  private let host: String
  private let port: Int
  private let username: String
  private let password: String?
  private let privateKey: String?
  
  init(host: String, port: Int, username: String, password: String?, privateKey: String?) {
    self.eventLoopGroup = MultiThreadedEventLoopGroup(numberOfThreads: 1)
    self.host = host
    self.port = port
    self.username = username
    self.password = password
    self.privateKey = privateKey
  }
  
  static func connect(host: String, port: Int, username: String, password: String?, privateKey: String?) async throws -> SSHClient {
    let client = SSHClient(host: host, port: port, username: username, password: password, privateKey: privateKey)
    try await client.performConnect()
    return client
  }
  
  private func performConnect() async throws {
    let userAuthDelegate = SimplePasswordDelegate(username: self.username, password: self.password ?? "")
    let serverAuthDelegate = AcceptAllHostKeysDelegate()
    
    let bootstrap = ClientBootstrap(group: eventLoopGroup)
      .channelOption(ChannelOptions.socket(SocketOptionLevel(SOL_SOCKET), SO_REUSEADDR), value: 1)
      .channelInitializer { channel in
        let sshHandler = NIOSSHHandler(
          role: .client(.init(
            userAuthDelegate: userAuthDelegate,
            serverAuthDelegate: serverAuthDelegate
          )),
          allocator: channel.allocator,
          inboundChildChannelInitializer: nil
        )
        
        return channel.pipeline.addHandler(sshHandler)
      }
    
    do {
      let channel = try await bootstrap.connect(host: host, port: port).get()
      self.channel = channel
      self._isConnected = true
    } catch {
      throw SSHError.connectionFailed
    }
  }
  
  func executeCommand(_ command: String) async throws -> String {
    guard isConnected, let channel = self.channel else {
      throw SSHError.notConnected
    }
    
    return try await withCheckedThrowingContinuation { continuation in
      let promise = channel.eventLoop.makePromise(of: String.self)
      
      let childChannelHandler = ExecChannelHandler(command: command, promise: promise)
      
      // Get the SSH handler and create a child channel
      let sshHandlerFuture = channel.pipeline.handler(type: NIOSSHHandler.self)
      
      sshHandlerFuture.whenSuccess { sshHandler in
        let channelPromise = channel.eventLoop.makePromise(of: Channel.self)
        sshHandler.createChannel(channelPromise, channelType: .session) { childChannel, _ in
          return childChannel.pipeline.addHandler(childChannelHandler)
        }
        
        channelPromise.futureResult.whenFailure { error in
          promise.fail(error)
        }
        
        channelPromise.futureResult.whenSuccess { childChannel in
          // Channel created successfully
        }
      }
      
      sshHandlerFuture.whenFailure { error in
        promise.fail(error)
      }
      
      promise.futureResult.whenComplete { result in
        switch result {
        case .success(let output):
          continuation.resume(returning: output)
        case .failure(let error):
          continuation.resume(throwing: error)
        }
      }
    }
  }
  
  func disconnect() {
    guard let channel = self.channel else { return }
    _ = channel.close()
    self.channel = nil
    self._isConnected = false
    try? eventLoopGroup.syncShutdownGracefully()
  }
}

// MARK: - SSH Authentication Delegates

class SimplePasswordDelegate: NIOSSHClientUserAuthenticationDelegate {
  private let username: String
  private let password: String
  
  init(username: String, password: String) {
    self.username = username
    self.password = password
  }
  
  func nextAuthenticationType(availableMethods: NIOSSHAvailableUserAuthenticationMethods, nextChallengePromise: EventLoopPromise<NIOSSHUserAuthenticationOffer?>) {
    if availableMethods.contains(.password) {
      let authenticationOffer = NIOSSHUserAuthenticationOffer(
        username: username,
        serviceName: "ssh-connection",
        offer: .password(.init(password: password))
      )
      nextChallengePromise.succeed(authenticationOffer)
    } else {
      nextChallengePromise.succeed(nil)
    }
  }
}

class AcceptAllHostKeysDelegate: NIOSSHClientServerAuthenticationDelegate {
  func validateHostKey(hostKey: NIOSSHPublicKey, validationCompletePromise: EventLoopPromise<Void>) {
    // For development - in production you should properly validate host keys
    validationCompletePromise.succeed(())
  }
}

// MARK: - Channel Handler for executing commands

class ExecChannelHandler: ChannelInboundHandler {
  typealias InboundIn = SSHChannelData
  typealias OutboundOut = SSHChannelData
  
  private let command: String
  private let promise: EventLoopPromise<String>
  private var buffer = ByteBuffer()
  
  init(command: String, promise: EventLoopPromise<String>) {
    self.command = command
    self.promise = promise
  }
  
  func channelActive(context: ChannelHandlerContext) {
    // Request exec channel type and execute command
    context.triggerUserOutboundEvent(SSHChannelRequestEvent.ExecRequest(command: command, wantReply: true), promise: nil)
  }
  
  func channelRead(context: ChannelHandlerContext, data: NIOAny) {
    let channelData = unwrapInboundIn(data)
    
    switch channelData.type {
    case .channel:
      let ioData = channelData.data
      switch ioData {
      case .byteBuffer(let byteBuffer):
        buffer.writeImmutableBuffer(byteBuffer)
      case .fileRegion:
        break // Handle file region if needed
      }
    default:
      break
    }
  }
  
  func channelInactive(context: ChannelHandlerContext) {
    let output = buffer.getString(at: 0, length: buffer.readableBytes) ?? ""
    promise.succeed(output)
  }
  
  func errorCaught(context: ChannelHandlerContext, error: Error) {
    promise.fail(error)
    context.close(promise: nil)
  }
}

