import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { ProxyAgent } from 'undici';

type Proxy = {
  host: string;
  password?: string;
  port: string;
  protocol: string;
  username?: string;
};

function selectProxyAgent(proxyUrl: string): HttpsProxyAgent<string> | SocksProxyAgent {
  const url = new URL(proxyUrl);

  // NOTE: The following constants are not used in the function but are defined for clarity.
  // When a proxy URL is used to build the URL object, the protocol returned by procotol's property contains a `:` at
  // the end so, we add the protocol constants without the `:` to avoid confusion.
  const PROXY_HTTP_PROTOCOL = 'http:';
  const PROXY_SOCKS_PROTOCOL = 'socks:';

  switch (url.protocol) {
    case PROXY_HTTP_PROTOCOL:
      return new HttpsProxyAgent(url);
    case PROXY_SOCKS_PROTOCOL:
      return new SocksProxyAgent(url);
    default:
      throw new Error(`Unsupported proxy protocol: ${url.protocol}`);
  }
}

export function makeProxyAgent(proxy: Proxy | string): HttpsProxyAgent<string> | SocksProxyAgent {
  if (typeof proxy === 'string') {
    return selectProxyAgent(proxy);
  }

  const { host, password, port, protocol, username } = proxy;
  let proxyUrl = `${protocol}://${host}:${port}`;

  if (username && password) {
    proxyUrl = `${protocol}://${username}:${password}@${host}:${port}`;
  }

  return selectProxyAgent(proxyUrl);
}

export function makeProxyAgentUndici(proxy: Proxy | string): ProxyAgent {
  let proxyUrl: string;
  let protocol: string;

  if (typeof proxy === 'string') {
    const url = new URL(proxy);
    protocol = url.protocol.replace(':', '');
    proxyUrl = proxy;
  } else {
    const { host, password, port, protocol: proto, username } = proxy;
    protocol = (proto || 'http').replace(':', '');

    if (protocol === 'socks') {
      protocol = 'socks5';
    }

    const auth = username && password ? `${username}:${password}@` : '';
    proxyUrl = `${protocol}://${auth}${host}:${port}`;
  }

  const PROXY_HTTP_PROTOCOL = 'http';
  const PROXY_HTTPS_PROTOCOL = 'https';
  const PROXY_SOCKS4_PROTOCOL = 'socks4';
  const PROXY_SOCKS5_PROTOCOL = 'socks5';

  switch (protocol) {
    case PROXY_HTTP_PROTOCOL:
    case PROXY_HTTPS_PROTOCOL:
    case PROXY_SOCKS4_PROTOCOL:
    case PROXY_SOCKS5_PROTOCOL:
      return new ProxyAgent(proxyUrl);

    default:
      throw new Error(`Unsupported proxy protocol: ${protocol}`);
  }
}
