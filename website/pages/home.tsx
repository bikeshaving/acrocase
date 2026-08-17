import dictionary from "../../dictionary.json";

const acronyms = [...Object.keys(dictionary.acronyms), "ACRO"].sort((a, b) => b.length - a.length);
const acronymPattern = new RegExp(`(${acronyms.map((a) => a + "|" + a.toLowerCase()).join("|")})`, "g");
const acronymSet = new Set(acronyms.flatMap((a) => [a, a.toLowerCase()]));

function Acro({children}: {children: string}) {
	const parts = children.split(acronymPattern);
	return <>{parts.map((part) =>
		acronymSet.has(part) ? <span class="acro">{part}</span> : part
	)}</>;
}

export function HomePage() {
	return (
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>ACROCase - Acronyms Consistently Retain Original Case</title>
				<meta
					name="description"
					content="A naming convention that preserves acronym casing in camelCase and PascalCase identifiers."
				/>
				<style>{`
					* { box-sizing: border-box; margin: 0; padding: 0; }
					body {
						font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
						line-height: 1.7;
						color: #1a1a1a;
						background: #fafafa;
					}
					main {
						max-width: 720px;
						margin: 0 auto;
						padding: 3rem 1.5rem;
					}
					h1 {
						font-size: 2.5rem;
						margin-bottom: 0.5rem;
						color: #111;
					}
					h2 {
						font-size: 1.5rem;
						margin: 2.5rem 0 1rem;
						color: #222;
						border-bottom: 2px solid #e5e5e5;
						padding-bottom: 0.5rem;
					}
					h3 {
						font-size: 1.1rem;
						margin: 1.5rem 0 0.75rem;
						color: #333;
					}
					p {
						margin-bottom: 1rem;
					}
					.tagline {
						font-size: 1.25rem;
						color: #666;
						margin-bottom: 2rem;
					}
					code {
						background: #f0f0f0;
						padding: 0.15rem 0.4rem;
						border-radius: 4px;
						font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
						font-size: 0.9em;
					}
					pre {
						background: #f5f5f5;
						padding: 1rem;
						border-radius: 8px;
						overflow-x: auto;
						margin: 1rem 0;
						border: 1px solid #e0e0e0;
					}
					pre code {
						background: none;
						padding: 0;
					}
					.comparison {
						display: grid;
						grid-template-columns: 1fr 1fr;
						gap: 1rem;
						margin: 1.5rem 0;
					}
					.comparison > div {
						padding: 1rem;
						border-radius: 8px;
					}
					.do {
						background: #e8f5e9;
						border: 1px solid #a5d6a7;
					}
					.do h4 {
						color: #2e7d32;
						margin-bottom: 0.5rem;
					}
					.dont {
						background: #ffebee;
						border: 1px solid #ef9a9a;
					}
					.dont h4 {
						color: #c62828;
						margin-bottom: 0.5rem;
					}
					ul, ol {
						margin: 1rem 0;
						padding-left: 1.5rem;
					}
					li {
						margin-bottom: 0.5rem;
					}
					a {
						color: #1976d2;
						text-decoration: none;
					}
					a:hover {
						text-decoration: underline;
					}
					.examples {
						background: #fff;
						border: 1px solid #e0e0e0;
						border-radius: 8px;
						padding: 1rem;
						margin: 1rem 0;
					}
					.examples table {
						width: 100%;
						border-collapse: collapse;
					}
					.examples th, .examples td {
						text-align: left;
						padding: 0.5rem;
						border-bottom: 1px solid #eee;
					}
					.examples th {
						font-weight: 600;
						color: #555;
					}
					.examples tr:last-child td {
						border-bottom: none;
					}
					.examples td:first-child {
						color: #c62828;
						font-weight: 600;
						font-family: 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
						font-size: 0.9em;
					}
					.acro {
						color: #c62828;
						font-weight: 600;
					}
					.note {
						background: #fff3e0;
						border-left: 4px solid #ff9800;
						padding: 1rem;
						margin: 1rem 0;
						border-radius: 0 8px 8px 0;
					}
					footer {
						margin-top: 4rem;
						padding-top: 2rem;
						border-top: 1px solid #e5e5e5;
						color: #666;
						font-size: 0.9rem;
					}
					@media (max-width: 600px) {
						.comparison {
							grid-template-columns: 1fr;
						}
						h1 {
							font-size: 2rem;
						}
					}
				`}</style>
			</head>
			<body>
				<main>
					<h1><Acro>ACROCase</Acro></h1>
					<p class="tagline">
						<strong class="acro">A</strong>cronyms <strong class="acro">C</strong>onsistently <strong class="acro">R</strong>etain <strong class="acro">O</strong>riginal <strong>Case</strong>
					</p>

					<p>
						<Acro>The web platform has hundreds of APIs that contain acronyms. With remarkable consistency, those acronyms are kept uppercase:</Acro>{" "}
						<code><Acro>innerHTML</Acro></code>, <code><Acro>XMLDocument</Acro></code>, <code><Acro>toJSON</Acro></code>, <code><Acro>encodeURIComponent</Acro></code>.{" "}
						<Acro>ACROCase is a name for this convention, and an ESLint plugin to enforce it.</Acro>
					</p>

					<h2><Acro>Acronyms in Web APIs</Acro></h2>

					<div class="examples">
						<table>
							<thead>
								<tr>
									<th>Acronym</th>
									<th><Acro>Web platform APIs</Acro></th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>HTML</td>
									<td><code><Acro>HTMLElement</Acro></code>, <code><Acro>HTMLCollection</Acro></code>, <code><Acro>innerHTML</Acro></code>, <code><Acro>outerHTML</Acro></code></td>
								</tr>
								<tr>
									<td>CSS</td>
									<td><code><Acro>CSSStyleSheet</Acro></code>, <code><Acro>CSSRule</Acro></code>, <code><Acro>CSSStyleDeclaration</Acro></code></td>
								</tr>
								<tr>
									<td>DOM</td>
									<td><code><Acro>DOMParser</Acro></code>, <code><Acro>DOMRect</Acro></code>, <code><Acro>DOMTokenList</Acro></code>, <code><Acro>DOMException</Acro></code></td>
								</tr>
								<tr>
									<td>SVG</td>
									<td><code><Acro>SVGElement</Acro></code>, <code><Acro>SVGPathElement</Acro></code>, <code><Acro>SVGRectElement</Acro></code></td>
								</tr>
								<tr>
									<td>URL</td>
									<td><code><Acro>URL</Acro></code>, <code><Acro>URLSearchParams</Acro></code>, <code><Acro>URLPattern</Acro></code>, <code><Acro>createObjectURL</Acro></code></td>
								</tr>
								<tr>
									<td>URI</td>
									<td><code><Acro>encodeURI</Acro></code>, <code><Acro>decodeURI</Acro></code>, <code><Acro>encodeURIComponent</Acro></code></td>
								</tr>
								<tr>
									<td>JSON</td>
									<td><code><Acro>JSON</Acro>.parse()</code>, <code><Acro>JSON</Acro>.stringify()</code>, <code><Acro>toJSON</Acro></code></td>
								</tr>
								<tr>
									<td>XML</td>
									<td><code><Acro>XMLDocument</Acro></code>, <code><Acro>XMLSerializer</Acro></code>, <code><Acro>XMLHttpRequest</Acro></code></td>
								</tr>
								<tr>
									<td>GPU</td>
									<td><code><Acro>GPUDevice</Acro></code>, <code><Acro>GPUBuffer</Acro></code>, <code><Acro>GPUTexture</Acro></code>, <code><Acro>GPUAdapter</Acro></code></td>
								</tr>
								<tr>
									<td>RTC</td>
									<td><code><Acro>RTCPeerConnection</Acro></code>, <code><Acro>RTCDataChannel</Acro></code>, <code><Acro>RTCSessionDescription</Acro></code></td>
								</tr>
								<tr>
									<td>IDB</td>
									<td><code><Acro>IDBDatabase</Acro></code>, <code><Acro>IDBObjectStore</Acro></code>, <code><Acro>IDBTransaction</Acro></code></td>
								</tr>
								<tr>
									<td>USB</td>
									<td><code><Acro>USB</Acro></code>, <code><Acro>USBDevice</Acro></code>, <code><Acro>USBConfiguration</Acro></code></td>
								</tr>
								<tr>
									<td>HID</td>
									<td><code><Acro>HID</Acro></code>, <code><Acro>HIDDevice</Acro></code>, <code><Acro>HIDConnectionEvent</Acro></code></td>
								</tr>
								<tr>
									<td>MIDI</td>
									<td><code><Acro>MIDIAccess</Acro></code>, <code><Acro>MIDIInput</Acro></code>, <code><Acro>MIDIOutput</Acro></code></td>
								</tr>
								<tr>
									<td>GATT</td>
									<td><code><Acro>BluetoothRemoteGATTServer</Acro></code>, <code><Acro>BluetoothRemoteGATTService</Acro></code></td>
								</tr>
								<tr>
									<td>BYOB</td>
									<td><code><Acro>ReadableStreamBYOBReader</Acro></code>, <code><Acro>ReadableStreamBYOBRequest</Acro></code></td>
								</tr>
								<tr>
									<td>VTT</td>
									<td><code><Acro>VTTCue</Acro></code>, <code><Acro>VTTRegion</Acro></code></td>
								</tr>
								<tr>
									<td>XR</td>
									<td><code><Acro>XRSystem</Acro></code>, <code><Acro>XRSession</Acro></code>, <code><Acro>XRFrame</Acro></code></td>
								</tr>
								<tr>
									<td>DTMF</td>
									<td><code><Acro>RTCDTMFSender</Acro></code>, <code><Acro>RTCDTMFToneChangeEvent</Acro></code></td>
								</tr>
							</tbody>
						</table>
					</div>

					<p>
						100+ <code><Acro>HTML</Acro>*</code> interfaces. 80+ <code><Acro>SVG</Acro>*</code>. 50+ <code><Acro>CSS</Acro>*</code>.
						30+ each for <code><Acro>GPU</Acro>*</code>, <code><Acro>RTC</Acro>*</code>, and <code><Acro>XR</Acro>*</code>.
					</p>

					<h2>Not Acronyms</h2>
					<p>
						<code>Id</code> is an abbreviation, not an acronym.
						<Acro>The DOM uses</Acro> <code>getElementById</code>, <code>elementId</code>, <code>clientId</code>.
						<Acro>Similarly, the Internationalization API is</Acro> <code>Intl</code>, not <code><Acro>INTL</Acro></code>.
					</p>

					<h2>Chaining</h2>
					<p>
						When two acronyms are adjacent, one gets titlecased.
						<code><Acro>XMLHttpRequest</Acro></code> should be <code><Acro>XMLHTTPRequest</Acro></code> by the convention's own logic,
						but <code><Acro>XMLHTTP</Acro></code> is where you lose the boundary.
					</p>
					<p>
						<Acro>The Web Crypto API titlecases all its acronyms for the same reason:</Acro>
					</p>
					<ul>
						<li><code><Acro>AESCBCParams</Acro></code> is written <code>AesCbcParams</code></li>
						<li><code><Acro>RSAOAEPParams</Acro></code> is written <code>RsaOaepParams</code></li>
					</ul>
					<p>
						<Acro>WebRTC does the same selectively:</Acro>
						{" "}<code><Acro>RTCDtlsTransport</Acro></code>, <code><Acro>RTCRtpSender</Acro></code>.
						<Acro>But not always:</Acro> <code><Acro>RTCDTMFSender</Acro></code> <Acro>keeps DTMF uppercase.</Acro>
					</p>

					<h2>The Convention</h2>
					<div class="examples">
						<table>
							<thead>
								<tr>
									<th></th>
									<th>acroCase</th>
									<th><Acro>UpperACROCase</Acro></th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Start</td>
									<td><code>urlString</code></td>
									<td><code><Acro>URLString</Acro></code></td>
								</tr>
								<tr>
									<td>End</td>
									<td><code><Acro>imageURL</Acro></code></td>
									<td><code><Acro>ImageURL</Acro></code></td>
								</tr>
								<tr>
									<td>Multiple</td>
									<td><code><Acro>htmlToJSON</Acro></code></td>
									<td><code><Acro>HTMLToJSON</Acro></code></td>
								</tr>
							</tbody>
						</table>
					</div>

					<h2><Acro>ESLint</Acro> Plugin</h2>
					<pre><code>{`npm install eslint-plugin-acrocase --save-dev`}</code></pre>
					<pre><code>{`{
  "plugins": ["acrocase"],
  "rules": {
    "acrocase/acrocase": "error"
  }
}`}</code></pre>
					<p>
						Reports without rewriting, like <Acro>ESLint</Acro>'s own naming rules. Ships
						with a <a href="https://github.com/bikeshaving/acrocase/blob/main/dictionary.json">dictionary</a> of
						139 acronyms. Extensible:
					</p>
					<pre><code>{`{
  "acrocase/acrocase": ["error", {
    "acronyms": ["GCP", "NATS"]
  }]
}`}</code></pre>

					<footer>
						<p>
							<Acro>ACROCase</Acro> is a name for a convention the web platform established decades ago.
						</p>
					</footer>
				</main>
			</body>
		</html>
	);
}
