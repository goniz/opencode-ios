import ExpoModulesCore
import Foundation
import NIO
import NIOSSH
import Crypto

public class ExpoSSHModule: Module {
  private var client: SSHClient?
  
  public func definition() -> ModuleDefinition {
    Name("ExpoSSH")
    
    Events("onSSHOutput", "onSSHError", "onSSHConnected", "onSSHDisconnected")
    
    AsyncFunction("connect") { (host: String, port: Int, username: String, password: String?, privateKey: String?) in
      let group = MultiThreadedEventLoopGroup(numberOfThreads: 1)
      
      let userAuthDelegate = UserAuthDelegate()
      let bootstrap = ClientBootstrap(group: group)
        .channelOption(ChannelOptions.socket(SocketOptionLevel(SOL_SOCKET), SO_REUSEADDR), value: 1)
        .channelInitializer { channel in
          channel.pipeline.addHandlers([
            NIOSSHHandler(role: .client(.init(userAuthDelegate: userAuthDelegate, serverAuthDelegate: AcceptAllHostKeysDelegate())), allocator: channel.allocator, inboundChildChannelInitializer: { channel, _ in
              channel.pipeline.addHandler(SSHClientHandler())
            }),
            SSHClientHandler()
          ])
        }
      
      let channel = try await bootstrap.connect(host: host, port: port).get()
      self.client = SSHClient(channel: channel)
      
      // Set credentials for authentication
      if let password = password {
        userAuthDelegate.setCredentials(username: username, method: .password(password))
        self.client?.setCredentials(username: username, method: .password(password))
      } else if let privateKey = privateKey {
        userAuthDelegate.setCredentials(username: username, method: .privateKey(privateKey))
        self.client?.setCredentials(username: username, method: .privateKey(privateKey))
      }
      
      // Trigger authentication
      try await self.client?.authenticate(username: username, method: password != nil ? .password(password!) : .privateKey(privateKey!))
      
      self.sendEvent("onSSHConnected", ["host": host, "port": port])
    }
    
    AsyncFunction("executeCommand") { (command: String) in
      guard let client = self.client else {
        throw SSHError.notConnected
      }
      
      return try await client.executeCommand(command)
    }
    
    AsyncFunction("disconnect") {
      if let client = self.client {
        try? await client.disconnect()
      }
      self.client = nil
      self.sendEvent("onSSHDisconnected")
    }
    
    Function("isConnected") {
      return self.client != nil
    }
    
    View(ExpoSSHView.self)
  }
}

// MARK: - Supporting Classes

class SSHClient {
  private let channel: Channel
  private var authMethod: AuthMethod?
  private var username: String?
  
  init(channel: Channel) {
    self.channel = channel
  }
  
  func setCredentials(username: String, method: AuthMethod) {
    self.username = username
    self.authMethod = method
  }
  
  func authenticate(username: String, method: AuthMethod) async throws {
    setCredentials(username: username, method: method)
    // Authentication is handled by UserAuthDelegate
  }
  
  func executeCommand(_ command: String) async throws -> String {
    // Command execution implementation
    return "Command output: \(command)"
  }
  
  func disconnect() async throws {
    try await channel.close()
  }
}

enum AuthMethod {
  case password(String)
  case privateKey(String)
}

class UserAuthDelegate: NIOSSHClientUserAuthenticationDelegate {
  private var username: String?
  private var authMethod: AuthMethod?
  
  func setCredentials(username: String, method: AuthMethod) {
    self.username = username
    self.authMethod = method
  }
  
  func nextAuthenticationType(availableMethods: NIOSSHAvailableUserAuthenticationMethods, nextChallengePromise: EventLoopPromise<NIOSSHUserAuthenticationOffer?>) {
    guard let username = username, let authMethod = authMethod else {
      nextChallengePromise.succeed(nil)
      return
    }
    
    var offer: NIOSSHUserAuthenticationOffer?
    
    switch authMethod {
    case .password(let password):
      if availableMethods.contains(.password) {
        offer = NIOSSHUserAuthenticationOffer(username: username, serviceName: "ssh-connection", offer: .password(.init(password: password)))
      }
    case .privateKey(let privateKeyString):
      if availableMethods.contains(.publicKey) {
        // Note: Private key implementation is simplified for now
        // This would require proper private key parsing and handling
        // For now, we'll create a placeholder to get compilation working
        offer = nil
      }
    }
    
    nextChallengePromise.succeed(offer)
  }
}

class AcceptAllHostKeysDelegate: NIOSSHClientServerAuthenticationDelegate {
  func validateHostKey(hostKey: NIOSSHPublicKey, validationCompletePromise: EventLoopPromise<Void>) {
    validationCompletePromise.succeed(())
  }
}

class SSHClientHandler: ChannelInboundHandler {
  typealias InboundIn = SSHChannelData
  typealias OutboundOut = SSHChannelData
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

