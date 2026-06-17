# Design memory

## Brand color = orange (not red)
Caucasus Auto uses an ORANGE brand accent (carrot #f9700b) on a dark near-black industrial theme, NOT red. Red is reserved for danger/status only. Display font Oswald (condensed), body Inter, mono JetBrains Mono for prices. Confirmed by user. Tokens in _design/tokens.json.

## Georgian text font = Noto Sans Georgian fallback
Oswald (display) and Inter (body) do NOT cover Georgian glyphs. Noto Sans Georgian (wght 400-900) is added as the next item in BOTH font stacks in _design/tokens.json so the browser renders Georgian per-glyph in Noto Sans Georgian while Latin/digits stay in Oswald/Inter. Always keep Noto Sans Georgian in the stack for any Georgian-language screen. Numbers/prices stay JetBrains Mono.

## Brand = SRL / Soreli (logo mark)
The product brand is SRL / SORELI (srl.ge — Georgian car import & transport from US auctions), NOT "Caucasus Auto" (that was only a style reference). Logo = layered wing/open-book mark rebuilt as inline SVG (Mark component, orange brand fills) + "SRL" display wordmark with "SORELI" in tracked mono caps beneath. Recreate inline — the source PNG (/Users/beqolozi/Developer/caltrack/assets/mascot/logo.png) is a local file that cannot load in the sandbox. Domain soreli.ge. Keeps the orange-on-dark theme. See [[brand-color-orange-not-red]].
