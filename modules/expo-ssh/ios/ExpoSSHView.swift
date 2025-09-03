import ExpoModulesCore
import SwiftUI
import WebKit

// Define props for the ExpoSSHView
class ExpoSSHViewProps: ExpoSwiftUI.ViewProps {
  var onLoad = EventDispatcher()
}

// This view will be used as a native component. Make sure to inherit from `ExpoSwiftUIView`
// to apply the proper styling (e.g. border radius and shadows).
struct ExpoSSHView: ExpoSwiftUIView {
  typealias Props = ExpoSSHViewProps
  
  let props: Props
  @State private var webView = WKWebView()
  @State private var delegate: WebViewDelegate?

  init(props: Props) {
    self.props = props
  }

  var body: some View {
    WebViewRepresentable(
      webView: webView,
      onLoad: props.onLoad
    )
    .onAppear {
      setupWebView()
    }
  }
  
  private func setupWebView() {
    delegate = WebViewDelegate { url in
      props.onLoad(["url": url])
    }
    webView.navigationDelegate = delegate
  }
}

struct WebViewRepresentable: UIViewRepresentable {
  let webView: WKWebView
  let onLoad: EventDispatcher
  
  func makeUIView(context: Context) -> WKWebView {
    return webView
  }
  
  func updateUIView(_ uiView: WKWebView, context: Context) {
    // Update the view if needed
  }
}

class WebViewDelegate: NSObject, WKNavigationDelegate {
  let onUrlChange: (String) -> Void

  init(onUrlChange: @escaping (String) -> Void) {
    self.onUrlChange = onUrlChange
  }

  func webView(_ webView: WKWebView, didFinish navigation: WKNavigation) {
    if let url = webView.url {
      onUrlChange(url.absoluteString)
    }
  }
}
