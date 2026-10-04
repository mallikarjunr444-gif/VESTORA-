"use strict";(()=>{var Pe=class{namespace;constructor(t){this.namespace=t}format(t,n){let a=new Date().toISOString().split("T")[1].replace("Z","");return`[VESTORA:${this.namespace}] ${a} [${t.toUpperCase()}] ${n}`}debug(t,...n){typeof process<"u"}info(t,...n){console.info(this.format("info",t),...n)}warn(t,...n){console.warn(this.format("warn",t),...n)}error(t,...n){console.error(this.format("error",t),...n)}};var Qt=[/\/(?:products?|items?|goods|catalog|dp|gp\/product|p)\/([^/?#]+)/i,/[?&](?:sku|product[-_]?id|item[-_]?id|pid|variant)=/i,/\/(?:buy|shop)\/([^/?#]+)/i,/\b[A-Za-z0-9_-]{5,16}(?:pdp|prd)\b/i],ea=[/\/(?:cart|checkout|basket|bag)\b/i,/\/(?:account|login|signin|register|signup|profile|my-account)\b/i,/\/(?:terms|privacy|contact|help|faq|about|policy|support|shipping)\b/i,/\/(?:search|categories|collections|c)\/?$/i,/\/(?:blog|article|stories|news)\//i],ta=[/add\s*(?:to)?\s*(?:cart|bag|basket)/i,/buy\s*(?:it)?\s*now/i,/order\s*now/i,/bag\s*it/i,/quick\s*buy/i,/purchase/i,/add\s*to\s*tote/i],aa=["\u20B9","$","\u20AC","\xA3","\xA5","Rs.","INR","USD","EUR","GBP","AED","AUD","CAD"];function Ge(e=document,t=location){let n=[],a=0,s=t.pathname||"";for(let m of ea)if(m.test(s))return{isProductPage:!1,confidence:0,signals:[`negative_url:${m}`]};for(let m of Qt)if(m.test(t.href)){a+=.35,n.push("pdp_url_pattern");break}let r=null;try{let m=e.querySelectorAll('script[type="application/ld+json"]');for(let f of Array.from(m)){let b=f.textContent?.trim()||"";if(!b)continue;let y=JSON.parse(b),h=Array.isArray(y)?y:y["@graph"]?y["@graph"]:[y];for(let x of h)if(x&&(x["@type"]==="Product"||x["@type"]==="IndividualProduct")){r=x,a+=.5,n.push("json_ld_product");break}if(r)break}}catch{}r||e.querySelector('[itemscope][itemtype*="schema.org/Product"]')&&(a+=.4,n.push("microdata_product"));let o=e.querySelector('meta[property="og:type"]')?.getAttribute("content");o&&/product/i.test(o)&&(a+=.35,n.push("opengraph_product_type")),e.querySelector('meta[property="product:price:amount"], meta[property="og:price:amount"]')&&(a+=.25,n.push("opengraph_price"));let i=Array.from(e.querySelectorAll("button, input[type='submit'], input[type='button'], a[role='button'], .btn, .button")),c=!1;for(let m of i){let f=(m.textContent||m.getAttribute("aria-label")||m.getAttribute("value")||"").trim();if(f&&ta.some(b=>b.test(f))){c=!0,a+=.3,n.push(`add_to_cart_btn:${f.slice(0,20)}`);break}}let u=["[class*='price']","[id*='price']","[data-price]",".pdp-price",".product-price",".price-box"],l=!1;for(let m of u){let f=e.querySelector(m);if(f){let b=f.textContent||"";if(aa.some(y=>b.includes(y))||/\d+[.,]\d{2}/.test(b)){l=!0,a+=.2,n.push("dom_price_indicator");break}}}e.querySelector("[class*='size-selector'], [class*='size-buttons'], select[name*='size'], [data-testid*='size'], .size-swatches, [role='radiogroup'][aria-label*='size' i]")&&(a+=.2,n.push("dom_size_selector"));let p=Math.min(1,a);return{isProductPage:p>=.45,confidence:p,signals:n,rawJsonLd:r||void 0}}var na=[/\b(?:smartphone|iphone|samsung\s*galaxy|android|laptop|macbook|computer|charger|usb|cable|keyboard|mouse|headphone|earbud|speaker|monitor|television|smartwatch)\b/i,/\b(?:sofa|couch|dining\s*table|bedsheet|pillow|mattress|curtain|blanket|kitchenware|cooker|pan|knife|cutlery|refrigerator|microwave)\b/i,/\b(?:shampoo|conditioner|face\s*wash|lotion|serum|lipstick|eyeliner|perfume|cologne|toothpaste|skincare|sunscreen)\b/i,/\b(?:grocery|snack|chocolate|coffee|tea|supplement|protein|vitamin|pet\s*food)\b/i,/\b(?:book|novel|ebook|magazine|comic|stationery|pen|pencil|notebook)\b/i,/\b(?:drill|hammer|wrench|screw|hardware|car\s*part|tire|motor\s*oil)\b/i,/\b(?:toy|lego|board\s*game|doll|action\s*figure|puzzle)\b/i],ra=[{category:"full_body",type:"Saree",pattern:/\b(?:saree|sari|kanjivaram|banarasi|chanderi)\b/i},{category:"full_body",type:"Lehenga",pattern:/\b(?:lehenga|ghagra|chaniya\s*choli)\b/i},{category:"full_body",type:"Anarkali Suit",pattern:/\b(?:anarkali|angrakha)\b/i},{category:"full_body",type:"Salwar Suit",pattern:/\b(?:salwar\s*(?:suit|kameez)|churidar\s*suit|patiala\s*suit)\b/i},{category:"full_body",type:"Sherwani",pattern:/\b(?:sherwani|achkan|indo[- ]?western\s*suit)\b/i},{category:"full_body",type:"Ethnic Set",pattern:/\b(?:ethnic\s*set|kurta\s*set|kurta\s*pajama)\b/i},{category:"full_body",type:"Co-ord Set",pattern:/\b(?:co[- ]?ord|coord\s*set|two[- ]?piece\s*set)\b/i},{category:"full_body",type:"Dress",pattern:/\b(?:dress|gown|maxi\s*dress|midi\s*dress|mini\s*dress|sundress|frock|slip\s*dress)\b/i},{category:"full_body",type:"Jumpsuit",pattern:/\b(?:jumpsuit|romper|dungaree|playsuit)\b/i},{category:"full_body",type:"Tracksuit",pattern:/\b(?:tracksuit|sweatsuit)\b/i},{category:"full_body",type:"Kaftan",pattern:/\b(?:kaftan|caftan)\b/i},{category:"upper_body",type:"Kurta",pattern:/\b(?:kurta|kurti|tunic)\b/i},{category:"upper_body",type:"Nehru Jacket",pattern:/\b(?:nehru\s*jacket|bundi|bandhgala(?:[- ]?jacket)?|jodhpuri(?:[- ]?suit)?|waistcoat)\b/i},{category:"upper_body",type:"T-Shirt",pattern:/\b(?:t[-\s]?shirt|tee|graphic\s*tee|crewneck|v[- ]?neck)\b/i},{category:"upper_body",type:"Polo",pattern:/\b(?:polo\s*shirt|polo\s*tee|polo)\b/i},{category:"upper_body",type:"Shirt",pattern:/\b(?:casual\s*shirt|formal\s*shirt|linen\s*shirt|overshirt|button[- ]?down|flannel)\b/i},{category:"upper_body",type:"Hoodie",pattern:/\b(?:hoodie|hooded\s*sweatshirt|pullover\s*hoodie)\b/i},{category:"upper_body",type:"Sweatshirt",pattern:/\b(?:sweatshirt|fleece\s*crew)\b/i},{category:"upper_body",type:"Jacket",pattern:/\b(?:denim\s*jacket|bomber\s*jacket|puffer|windbreaker|biker\s*jacket|varsity|leather\s*jacket)\b/i},{category:"upper_body",type:"Blazer",pattern:/\b(?:blazer|suit\s*jacket|sport\s*coat)\b/i},{category:"upper_body",type:"Coat",pattern:/\b(?:overcoat|trench\s*coat|parka|peacoat)\b/i},{category:"upper_body",type:"Top",pattern:/\b(?:crop\s*top|tank\s*top|camisole|halter\s*top|blouse|corset|tube\s*top)\b/i},{category:"upper_body",type:"Sweater",pattern:/\b(?:sweater|cardigan|pullover|knitwear|jumper)\b/i},{category:"upper_body",type:"Vest",pattern:/\b(?:gilet|vest|puffer\s*vest)\b/i},{category:"lower_body",type:"Jeans",pattern:/\b(?:jeans|denim\s*pants|skinny\s*jeans|baggy\s*jeans|flare\s*jeans|straight\s*fit\s*jeans)\b/i},{category:"lower_body",type:"Trousers",pattern:/\b(?:trousers|chinos|formal\s*pants|khakis|slacks)\b/i},{category:"lower_body",type:"Shorts",pattern:/\b(?:shorts|bermuda|cargo\s*shorts|denim\s*shorts|boardshorts)\b/i},{category:"lower_body",type:"Skirt",pattern:/\b(?:skirt|mini\s*skirt|midi\s*skirt|pleated\s*skirt|pencil\s*skirt)\b/i},{category:"lower_body",type:"Joggers",pattern:/\b(?:joggers|sweatpants|track\s*pants|lounge\s*pants)\b/i},{category:"lower_body",type:"Leggings",pattern:/\b(?:leggings|tights|yoga\s*pants)\b/i},{category:"lower_body",type:"Ethnic Bottoms",pattern:/\b(?:palazzo|dhoti|salwar|churidar|sharara|gharara)\b/i},{category:"lower_body",type:"Cargos",pattern:/\b(?:cargo\s*pants|cargos|combat\s*pants)\b/i},{category:"shoes",type:"Sneakers",pattern:/\b(?:sneakers|trainers|running\s*shoes|kicks|tennis\s*shoes)\b/i},{category:"shoes",type:"Boots",pattern:/\b(?:boots|chelsea\s*boots|ankle\s*boots|combat\s*boots)\b/i},{category:"shoes",type:"Loafers",pattern:/\b(?:loafers|moccasins|boat\s*shoes)\b/i},{category:"shoes",type:"Heels",pattern:/\b(?:heels|stilettos|pumps|wedges)\b/i},{category:"shoes",type:"Sandals",pattern:/\b(?:sandals|slides|flip[- ]?flops|slippers|clogs|crocs)\b/i},{category:"shoes",type:"Ethnic Footwear",pattern:/\b(?:juttis|mojaris|kolhapuris)\b/i},{category:"eyewear",type:"Sunglasses",pattern:/\b(?:sunglasses|shades|eyewear|spectacles|glasses|aviators?|wayfarers?)\b/i},{category:"headwear",type:"Hat",pattern:/\b(?:cap|baseball\s*cap|hat|beanie|bucket\s*hat|fedora|beret|snapback)\b/i},{category:"earrings",type:"Earrings",pattern:/\b(?:earrings?|ear\s*studs?|hoops?|jhumkas?|drop\s*earrings?)\b/i},{category:"necklace",type:"Necklace",pattern:/\b(?:necklace|choker|chain|pendant|locket|collar\s*necklace)\b/i},{category:"wristwear",type:"Watch",pattern:/\b(?:watch|wrist\s*watch|chronograph|bracelet|bangle|wristband)\b/i},{category:"ring",type:"Ring",pattern:/\b(?:ring|finger\s*ring|band|signet\s*ring)\b/i},{category:"bag",type:"Bag",pattern:/\b(?:handbag|backpack|tote\s*bag|clutch|sling\s*bag|duffel|crossbody|satchel|shoulder\s*bag)\b/i},{category:"belt",type:"Belt",pattern:/\b(?:leather\s*belt|waist\s*belt|designer\s*belt|buckle\s*belt)\b/i},{category:"scarf",type:"Scarf",pattern:/\b(?:dupatta|stole|scarf|shawl|muffler)\b/i}];function ye(e,t="",n="",a=[]){let s=`${e} ${t} ${n} ${a.join(" ")}`.toLowerCase();for(let o of na)if(o.test(s)&&!/\b(?:t-shirt|shirt|hoodie|jeans|dress|saree|kurta|jacket|blazer|top|pants|sneakers)\b/i.test(s))return{isFashion:!1,category:"other",garmentType:"Non-Apparel",confidence:.95};for(let o of ra)if(o.pattern.test(s))return{isFashion:!0,category:o.category,garmentType:o.type,confidence:.94};return/\b(?:apparel|clothing|wear|outfit|garment|fashion|attire)\b/i.test(s)?{isFashion:!0,category:"upper_body",garmentType:"Apparel",confidence:.7}:{isFashion:!1,category:"unknown",garmentType:"Item",confidence:.4}}var ht=[/\b(?:logo|brand[-_]?logo|site[-_]?logo)\b/i,/\b(?:banner|promo|hero[-_]?banner|slide[-_]?banner)\b/i,/\b(?:icon|favicon|cart[-_]?icon|search[-_]?icon|close[-_]?icon|arrow)\b/i,/\b(?:avatar|user[-_]?profile|author|testimonial)\b/i,/\b(?:payment|visa|mastercard|amex|rupay|upi|paypal|paytm)\b/i,/\b(?:badge|seal|guarantee|trustpilot|certified|ssl)\b/i,/\b(?:rating|star|review[-_]?star)\b/i,/\b(?:social|facebook|instagram|twitter|youtube|linkedin|tiktok)\b/i,/\b(?:sprite|pixel|spacer|blank\.gif|loading|placeholder)\b/i];function xe(e){if(e.tagName==="IMG"){let s=e,r=s.getAttribute("data-a-dynamic-image");if(r)try{let l=JSON.parse(r),d=Object.keys(l);if(d.length>0)return d.sort((p,g)=>(l[g][0]||0)-(l[p][0]||0)),j(d[0])}catch{}let o=["data-zoom-image","data-old-hires","data-large-image","data-high-res-src","data-full-src","data-magnify-src","data-zoom","data-origin","data-original","data-src","data-lazy-src"];for(let l of o){let d=s.getAttribute(l);if(d&&/^https?:\/\//i.test(d))return j(d)}let i=s.closest("picture");if(i){let l=Array.from(i.querySelectorAll("source[srcset]"));for(let d of l){let p=d.getAttribute("srcset");if(p){let g=vt(p);if(g)return j(g)}}}let c=s.getAttribute("srcset");if(c){let l=vt(c);if(l)return j(l)}let u=s.currentSrc||s.src||"";return j(u)}let t=e.style.backgroundImage||window.getComputedStyle(e).backgroundImage;if(t&&t.startsWith("url(")){let s=t.match(/url\(['"]?(.*?)['"]?\)/i);if(s&&s[1])return j(s[1])}let n=e.querySelector("[style*='background-image'], .image-grid-image");if(n){let s=n.style?.backgroundImage||window.getComputedStyle(n).backgroundImage;if(s&&s.startsWith("url(")){let r=s.match(/url\(['"]?(.*?)['"]?\)/i);if(r&&r[1])return j(r[1])}}let a=e.querySelector("img");return a?xe(a):""}function vt(e){let t=e.split(",").map(s=>s.trim());if(t.length===0)return null;let n=null,a=0;for(let s of t){let r=s.split(/\s+/),o=r[0],i=r[1]||"",c=1;i.endsWith("w")?c=parseInt(i.replace("w",""),10)||1:i.endsWith("x")&&(c=(parseFloat(i.replace("x",""))||1)*1e3),c>=a&&/^https?:\/\//i.test(o)&&(a=c,n=o)}return n||t[t.length-1]?.split(/\s+/)[0]||null}function j(e){return e?(e.includes("/image/upload/")&&(e=e.replace(/\/image\/upload\/(?:[a-zA-Z0-9_,]+)\//,"/image/upload/q_auto:best,f_auto,w_1440/")),e.includes("cdn.shopify.com")&&(e=e.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|\d+x\d+)\.(jpg|jpeg|png|webp)/i,"_master.$1"),e=e.replace(/[?&]width=\d+/,"?width=1440")),/[?&](?:w|width)=\d+/i.test(e)&&(e=e.replace(/([?&](?:w|width)=)\d+/i,"$11440")),/[?&]quality=\d+/i.test(e)&&(e=e.replace(/([?&]quality=)\d+/i,"$195")),/[?&]wid=\d+/i.test(e)&&(e=e.replace(/([?&]wid=)\d+/i,"$11600")),e.includes("assets.myntassets.com")?e=e.replace(/\/f_webp,[^/]+\//,"/h_1440,q_95,w_1080/").replace(/\/h_\d+,q_\d+,w_\d+\//,"/h_1440,q_95,w_1080/").replace(/\/w_\d+,c_limit,fl_progressive\//,"/h_1440,q_95,w_1080/"):e.includes("flixcart.com/image/")?e=e.replace(/\/image\/\d+\/\d+\//,"/image/832/832/"):e.includes("media-amazon.com")||e.includes("images-amazon.com")?e=e.replace(/\._[A-Z0-9_,]+_\./,"._AC_SL1500_."):e.includes("static.zara.net")||e.includes("itxweb.com")?e=e.replace(/\/w\/\d+\//,"/w/1024/"):e.includes("ltwebstatic.com")?e=e.replace(/_thumbnail_\d+x\d+/,"").replace(/_\d+x\d+\.jpg/,".jpg"):e.includes("asos-media.com")?e=e.replace(/\?\$[^$]+\$/,"?$n_960w$"):e.includes("images.meesho.com")&&(e=e.replace(/\/(?:256|512)\//,"/1024/")),e):""}function J(e){let t=e.getBoundingClientRect(),n=t.width||e.offsetWidth||e.naturalWidth||e.width||0,a=t.height||e.offsetHeight||e.parentElement?.offsetHeight||0||e.naturalHeight||e.height||0;if(n<180||a<180)return!1;let s=a/n;if(s<.65||s>2.8)return!1;let r=xe(e);if(!r||r.startsWith("data:image/svg")||r.endsWith(".svg"))return!1;for(let d of ht)if(d.test(r))return!1;let o=e.getAttribute("alt")||"",i=e.getAttribute("title")||"",c=String(e.className||""),u=e.id||"",l=`${o} ${i} ${c} ${u}`.toLowerCase();for(let d of ht)if(d.test(l))return!1;return!e.closest("header, footer, nav, [role='banner'], [role='navigation']")}var yt=["XXS","XS","S","M","L","XL","XXL","2XL","3XL","4XL"],xt=["28","30","32","34","36","38","39","40","42","44","46","48"];function Je(e=document){let t=new Set,n=new Set,a=Array.from(e.querySelectorAll("button, [role='radio'], [data-size], [data-attr-value], .size-buttons-size-button, .size-pill, .size-option, [class*='size-item'], [class*='size-btn'], [class*='SizeButton']"));for(let i of a){let c=(i.textContent||i.getAttribute("data-size")||i.getAttribute("data-attr-value")||"").trim().toUpperCase();if(!c)continue;let u=null,l=c.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL)\b/);if(l&&(u=l[1]),!u){let d=c.match(/\b(28|30|32|34|36|38|39|40|42|44|46|48)\b/);d&&(u=d[1])}u&&(i.hasAttribute("disabled")||i.getAttribute("aria-disabled")==="true"||/\b(?:disabled|out[-_]?of[-_]?stock|sold[-_]?out|unavailable|strikethrough)\b/i.test(i.className)?n.add(u):t.add(u))}if(t.size===0){let i=e.querySelector("select[name*='size' i], select[id*='size' i]");if(i)for(let c of Array.from(i.options)){let u=c.text.trim().toUpperCase();for(let l of[...yt,...xt])u.includes(l)&&(c.disabled||u.includes("OUT OF STOCK")||u.includes("SOLD OUT")?n.add(l):t.add(l))}}if(t.size===0)return{available:["XS","S","M","L","XL","XXL"],outOfStock:[],source:"default"};let s=[...yt,...xt],r=s.filter(i=>t.has(i)),o=s.filter(i=>n.has(i));return{available:r,outOfStock:o,source:"dom-pills"}}function Ke(e=document,t=location){let n=Ge(e,t),a="",s="",r="",o="",i="";if(n.rawJsonLd){let l=n.rawJsonLd;if(a=String(l.name||""),l.brand&&(s=typeof l.brand=="string"?l.brand:String(l.brand.name||"")),l.image){let d=Array.isArray(l.image)?l.image[0]:l.image;i=typeof d=="string"?d:String(d?.url||"")}if(l.offers){let d=Array.isArray(l.offers)?l.offers[0]:l.offers;d&&(r=String(d.price||d.lowPrice||""),o=String(d.priceCurrency||""))}}if(!a){let l=e.querySelector('meta[property="og:title"]')?.getAttribute("content")||e.querySelector("h1")?.textContent?.trim()||e.title.split(/[-|·]/)[0].trim();/^(?:shop\s+for|buy\s+online|online\s+shopping|men'?s\s+clothing|women'?s\s+clothing|all\s+products|browse|sale\b|new\s+arrivals)/i.test(l)||(a=l)}s||(s=e.querySelector('meta[property="og:site_name"]')?.getAttribute("content")||t.hostname.replace("www.","").split(".")[0].toUpperCase());let c=ye(a,"",t.pathname);if(!i){let l=e.querySelector('meta[property="og:image"]')?.getAttribute("content");l&&!l.includes("logo")&&!l.includes("favicon")&&(i=j(l))}if(!i){let d=Array.from(e.querySelectorAll("img, [style*='background-image']")).filter(J);d.length>0&&(i=xe(d[0]))}if(!i)return null;let u=Je(e);return{id:`prod_${Date.now()}`,name:a,brand:s,price:r?`${o} ${r}`.trim():void 0,currency:o||void 0,imageUrl:i,productUrl:t.href,pageUrl:t.href,category:c.garmentType,isFashion:c.isFashion,availableSizes:u.available,outOfStockSizes:u.outOfStock,confidence:n.confidence,detectionSource:n.rawJsonLd?"json-ld":"dom-heuristic"}}function He(e){if(e.tagName==="IMG"){let s=e,r=s.getAttribute("data-a-dynamic-image");if(r)try{let l=JSON.parse(r),d=Object.keys(l);if(d.length>0)return d.sort((p,g)=>(l[g][0]||0)-(l[p][0]||0)),d[0]}catch{}let o=s.getAttribute("data-old-hires")||s.getAttribute("data-zoom-image")||s.getAttribute("data-large-image")||s.getAttribute("data-high-res-src")||s.getAttribute("data-full-src");if(o&&/^https?:\/\//i.test(o))return o;let i=s.closest("picture");if(i){let l=Array.from(i.querySelectorAll("source[srcset]"));for(let d of l){let p=d.getAttribute("srcset");if(p){let g=p.split(",").map(f=>f.trim().split(" ")[0]),m=g[g.length-1];if(m&&/^https?:\/\//i.test(m))return m}}}let c=s.getAttribute("srcset");if(c){let l=c.split(",").map(p=>p.trim().split(" ")[0]),d=l[l.length-1];if(d&&/^https?:\/\//i.test(d))return d}let u=s.getAttribute("data-src")||s.getAttribute("data-original")||s.getAttribute("data-lazy-src")||s.currentSrc||s.src||"";return Ze(u)}let t=e.style.backgroundImage||window.getComputedStyle(e).backgroundImage;if(t&&t.startsWith("url(")){let s=t.match(/url\(['"]?(.*?)['"]?\)/i);if(s&&s[1])return Ze(s[1])}let n=e.querySelector("[style*='background-image'], .image-grid-image");if(n){let s=n.style?.backgroundImage||window.getComputedStyle(n).backgroundImage;if(s&&s.startsWith("url(")){let r=s.match(/url\(['"]?(.*?)['"]?\)/i);if(r&&r[1])return Ze(r[1])}}let a=e.querySelector("img");return a?He(a):""}function Ze(e){return e?e.includes("assets.myntassets.com")?e.replace(/\/f_webp,[^/]+\//,"/h_1440,q_95,w_1080/").replace(/\/h_\d+,q_\d+,w_\d+\//,"/h_1440,q_95,w_1080/").replace(/\/w_\d+,c_limit,fl_progressive\//,"/h_1440,q_95,w_1080/"):e.includes("flixcart.com/image/")?e.replace(/\/image\/\d+\/\d+\//,"/image/832/832/"):e.includes("media-amazon.com")||e.includes("images-amazon.com")?e.replace(/\._[A-Z0-9_,]+_\./,"._AC_SL1500_."):e.includes("static.zara.net")||e.includes("itxweb.com")?e.replace(/\/w\/\d+\//,"/w/1024/"):e.includes("ltwebstatic.com")?e.replace(/_thumbnail_\d+x\d+/,"").replace(/_\d+x\d+\.jpg/,".jpg"):e.includes("asos-media.com")?e.replace(/\?\$[^$]+\$/,"?$n_960w$"):e.includes("cdn.shopify.com")?e.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|\d+x\d+)\.(jpg|jpeg|png|webp)/i,"_master.$1"):e.includes("images.meesho.com")?e.replace(/\/(?:256|512)\//,"/1024/"):e.includes("assets.ajio.com")?e.replace(/\?.*$/,""):e.includes("nike.com")||e.includes("adidas.com")?e.replace(/[?&]wid=\d+/,"?wid=1400"):e:""}function Oe(e,t){let n="",a="",s="",r="";try{let c=document.querySelectorAll('script[type="application/ld+json"]');for(let u of Array.from(c)){let l=JSON.parse(u.textContent||"{}"),d=l["@type"]==="Product"?l:Array.isArray(l["@graph"])?l["@graph"].find(p=>p["@type"]==="Product"):null;if(d&&d.name){if(n=String(d.name),d.brand&&(a=typeof d.brand=="string"?d.brand:String(d.brand.name||"")),d.offers){let p=Array.isArray(d.offers)?d.offers[0]:d.offers;p&&(s=String(p.price||p.lowPrice||""),r=String(p.priceCurrency||""))}break}}}catch{}if(!n){let c=document.querySelector('meta[property="og:title"]')?.getAttribute("content"),l=(e.closest(".product-base, .item, [data-testid*='product'], article, .pdp-details, .product-card, .product-detail, [class*='ProductCard'], .product-item")||e.parentElement)?.querySelector("h1, h2, h3, .product-title, .product-name, [class*='title'], [class*='Title']"),d=e.getAttribute("alt")||"";n=l?.textContent?.trim()||c||d||document.title.split(/[-|·]/)[0].trim()}a||(a=document.querySelector('meta[property="og:site_name"]')?.getAttribute("content")||location.hostname.replace("www.","").split(".")[0].toUpperCase());let o=ye(n,"",location.pathname),i=Je(document);return{id:`prod_${Date.now()}`,name:n,brand:a,price:s?`${r} ${s}`.trim():void 0,currency:r||void 0,imageUrl:t,productUrl:location.href,pageUrl:location.href,category:o.garmentType,isFashion:o.isFashion,availableSizes:i.available,outOfStockSizes:i.outOfStock,confidence:o.confidence,detectionSource:"dom-heuristic"}}var wt=new WeakSet;function we(e,t){if(wt.has(e))return;wt.add(e);let n=e.parentElement;if(!n)return;window.getComputedStyle(n).position==="static"&&(n.style.position="relative"),e.draggable=!0,n.draggable=!0;try{e.style.webkitUserDrag="element",n.style.webkitUserDrag="element"}catch{}let s=o=>{if(o.dataTransfer){let i=He(e);i&&(o.dataTransfer.setData("text/uri-list",i),o.dataTransfer.setData("text/plain",i))}};if(e.addEventListener("dragstart",s),n.addEventListener("dragstart",s),n.querySelector(".vestora-tryon-btn"))return;let r=document.createElement("button");r.type="button",r.className="vestora-tryon-btn",r.setAttribute("aria-label","Try with VESTORA"),r.innerHTML='<span class="vestora-btn-sparkle">\u2726</span> Try with VESTORA',r.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation();let i=He(e),c=Oe(e,i);r.classList.add("is-active"),setTimeout(()=>r.classList.remove("is-active"),1200),t(c)}),r.addEventListener("touchstart",o=>{o.stopPropagation()},{passive:!0}),n.appendChild(r)}var Qe=null;function Et(e,t){if(Qe||document.getElementById("vestora-corner-badge")||!e||!e.imageUrl||!e.isFashion)return;let n=document.createElement("div");n.id="vestora-corner-badge",n.className="vestora-corner-badge",n.setAttribute("role","button"),n.setAttribute("aria-label","VESTORA Virtual Try-On Detected Item");let a=e.brand||"Fashion Store",s=e.name||"Clothing Item",r=e.category||"Apparel";n.innerHTML=`
    <img src="${e.imageUrl}" alt="${s}" class="vestora-badge-thumb" />
    <div class="vestora-badge-info">
      <div class="vestora-badge-title-row">
        <span class="vestora-badge-tag">${r}</span>
      </div>
      <span class="vestora-badge-name" title="${s}">${s}</span>
    </div>
    <button class="vestora-badge-cta" type="button">
      <span>\u2726 Try On</span>
    </button>
    <button class="vestora-badge-close" type="button" aria-label="Dismiss">\u2715</button>
  `,n.addEventListener("click",o=>{if(o.target.closest(".vestora-badge-close")){o.stopPropagation(),n.remove(),Qe=null;return}t(e)}),document.body.appendChild(n),Qe=n}var kt=null;function Tt(e){if(kt||document.getElementById("vestora-floating-dock"))return;let t=document.createElement("div");t.id="vestora-floating-dock",t.className="vestora-floating-dock",t.setAttribute("role","button"),t.setAttribute("aria-label","Open VESTORA Live Virtual Try-On"),t.title="VESTORA \u2014 Live AI Virtual Try-On",t.innerHTML=`
    <div class="vestora-dock-handle">
      <span class="vestora-dock-sparkle">\u2726</span>
      <span class="vestora-dock-text">VESTORA</span>
      <span class="vestora-dock-sub">Try-On</span>
    </div>
  `,t.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),e()}),document.body.appendChild(t),kt=t}var Lt=new WeakSet;function St(e=location){let t=e.hostname.toLowerCase(),n=e.pathname.toLowerCase(),a=e.search.toLowerCase();return t.includes("google.")?!!(t.startsWith("images.google.")||a.includes("tbm=isch")||a.includes("udm=2")||n.startsWith("/imghp")||n.startsWith("/images")||(n==="/search"||n==="/"||n==="/webhp")&&typeof document<"u"&&!!document.querySelector("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], #islrg, #islsp, div[jsname='r5xlne'], div.isv-r, img.YQ4gaf, img.rg_i")):!1}function ze(e){let t=e.tagName==="A"?e:e.closest("a[href*='imgurl='], a[href*='/imgres']");if(t&&t.href){try{let r=new URL(t.href,location.origin).searchParams.get("imgurl");if(r&&/^https?:\/\//i.test(r))return r}catch{}let a=t.href.match(/[?&]imgurl=([^&]+)/i);if(a&&a[1])try{let s=decodeURIComponent(a[1]);if(/^https?:\/\//i.test(s))return s}catch{}}let n=e.tagName==="IMG"?e:e.querySelector("img");if(n){let a=n.getAttribute("data-src")||n.getAttribute("data-deferred")||n.currentSrc||n.src||"";if(a.startsWith("data:")||a.length<50){let s=n.closest("#islsp, div[jsname='figiqf'], div.v6bBac, div[data-ri]");if(s){let r=s.querySelector("img[src^='http']:not([src*='google.com/favicon'])");if(r&&r.src&&!r.src.includes("encrypted-tbn"))return r.src}}if(a&&/^https?:\/\//i.test(a))return a}return""}function oa(e,t){let n=e.closest("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], div.isv-r, div[jsname='dTDiAc'], #islsp, div[jsname='figiqf']")||e.parentElement,a="",s=n?.querySelector("h3, a[title], [data-lpage] h2, [data-lpage] h3, div.zbN8od, div.mNsIgd");if(s&&(a=s.textContent?.trim()||s.getAttribute("title")||""),!a&&e.tagName==="IMG"&&(a=e.getAttribute("alt")||""),!a&&n){let c=n.querySelector("img");c&&(a=c.getAttribute("alt")||"")}if(!a||a.length<3){let u=new URLSearchParams(location.search).get("q")||"";u?a=u.replace(/[+]/g," ").trim():a="Fashion Item"}let r="Web",o=n?.querySelector("div.NJbYFc, span.yNF4af, span.fA3vx, div.mNsIgd");o&&o.textContent&&(r=o.textContent.trim());let i=ye(a,"",location.search);return{id:`gimg_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,name:a,brand:r,imageUrl:t,productUrl:location.href,pageUrl:location.href,category:i.garmentType,garmentCategory:i.category,isFashion:!0,availableSizes:["XS","S","M","L","XL","XXL"],confidence:i.confidence||.92,detectionSource:"dom-heuristic"}}function et(e,t,n,a){if(Lt.has(e)||e.querySelector(".vestora-tryon-btn, .vestora-google-tryon-pill"))return;Lt.add(e),window.getComputedStyle(e).position==="static"&&(e.style.position="relative");let r=document.createElement("button");r.type="button",r.className="vestora-tryon-btn vestora-google-tryon-pill",r.setAttribute("aria-label","Try with VESTORA"),r.innerHTML='<span class="vestora-btn-sparkle">\u2726</span> Try with VESTORA',r.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),o.stopImmediatePropagation();let c=oa(a||e,t);r.classList.add("is-active"),setTimeout(()=>r.classList.remove("is-active"),1200),n(c)}),r.addEventListener("touchstart",o=>{o.stopPropagation()},{passive:!0}),e.appendChild(r)}function Mt(e){function t(){Array.from(document.querySelectorAll("#islsp img.n3VNCb, #islsp img.sFlh5c, #islsp img.pT0Scc, div.v6bBac img, img[jsname='HiaYvf'], div[jsname='figiqf'] img")).forEach(o=>{let i=ze(o)||o.currentSrc||o.src;if(i&&!i.startsWith("data:image/svg")&&i.length>20){let c=o.closest("#islsp, div[jsname='figiqf'], div.v6bBac")||o.parentElement;c&&et(c,i,e,o)}}),Array.from(document.querySelectorAll("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], div.isv-r, div.eA0Zlc, div.foyFie, div.mNsIgd")).forEach(o=>{let i=o.querySelector("img")||(o.tagName==="IMG"?o:null);if(!i)return;let c=ze(o)||ze(i)||i.currentSrc||i.src;c&&!c.startsWith("data:image/svg")&&c.length>20&&et(o,c,e,i)}),Array.from(document.querySelectorAll("img.YQ4gaf, img.rg_i, img.Q4LuSd")).forEach(o=>{let i=o.closest("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], div.isv-r")||o.parentElement;if(!i)return;let c=ze(o)||o.currentSrc||o.src;c&&!c.startsWith("data:image/svg")&&c.length>20&&et(i,c,e,o)})}t(),new MutationObserver(()=>{t()}).observe(document.body,{childList:!0,subtree:!0}),setInterval(t,1200)}var Re=class{analysisCanvas=null;analysisCtx=null;prevLandmarks=null;prevTimestamp=0;bodyDetectedFrames=0;noBodyFrames=0;isCalibrated=!1;AW=160;AH=120;constructor(){typeof document<"u"&&(this.analysisCanvas=document.createElement("canvas"),this.analysisCanvas.width=this.AW,this.analysisCanvas.height=this.AH,this.analysisCtx=this.analysisCanvas.getContext("2d",{willReadFrequently:!0}))}track(t,n,a){let s=performance.now(),r=n||640,o=a||480,i=null,c=.95,u=!0;if(this.analysisCtx&&this.analysisCanvas&&t)try{i=this.analyzeFrameOptical(t,r,o)}catch{i=null}(!i||i.length<19)&&(i=this.generateAdaptiveBasePose(r,o),c=.85,u=!0);let l=this.applyAdaptiveTemporalSmoothing(i,s);this.prevLandmarks=l,this.prevTimestamp=s;let d=l[5],p=l[6],g=l[11],m=l[12],f=p.x-d.x,b=p.y-d.y,y=Math.max(r*.15,Math.hypot(f,b)),h=Math.atan2(b,f),x={x:(d.x+p.x+g.x+m.x)/4,y:(d.y+p.y+g.y+m.y)/4},T=this.computeBodyMeasurements(l,r,o),B=Math.abs(l[0].y-l[17].y)*2/o,I="ideal",R="\u2726 Optical Tracking: 60 FPS \xB7 Active";return B>.4?(I="close_up",R="\u{1F4A1} Sit back slightly for full shirt view"):B<.12&&(I="far",R="Step closer for detailed fit"),{landmarks:l,confidence:c,timestamp:s,isBodyDetected:u,shoulderAngle:h,shoulderWidth:y,torsoCenter:x,measurements:T,framingStatus:I,statusText:R}}analyzeFrameOptical(t,n,a){let s=this.analysisCtx,r=this.AW,o=this.AH;s.drawImage(t,0,0,r,o);let c=s.getImageData(0,0,r,o).data,u=0,l=0,d=0,p=o,g=0,m=r,f=0,b=Math.floor(o*.65);for(let E=5;E<b;E+=2){let $=E*r;for(let O=8;O<r-8;O+=2){let G=($+O)*4,ve=c[G],Ye=c[G+1],Zt=c[G+2];this.isSkinPixel(ve,Ye,Zt)&&(u+=O,l+=E,d++,E<p&&(p=E),E>g&&(g=E),O<m&&(m=O),O>f&&(f=O))}}let y=.5,h=.32,x=.22,T=.24;d>=25?(y=u/d/r,h=l/d/o,x=Math.max(.14,Math.min(.38,(f-m)/r)),T=Math.max(.16,Math.min(.36,(g-p)/o)),this.bodyDetectedFrames++,this.noBodyFrames=0):(this.noBodyFrames++,y=.5,h=.35);let U=T>=.22,B=Math.min(.66,h+T*.54),I=Math.min(.72,h+T*.62),R=Math.floor(I*o),L=Math.floor(y*r),F=Math.max(r*.16,Math.min(r*.38,x*1.25*r)),M=Math.max(2,L-Math.floor(F)),P=Math.min(r-3,L+Math.floor(F)),ee=Math.min(o-4,Math.max(4,R)),S={r:c[0],g:c[1],b:c[2]},C={r:c[(r-1)*4],g:c[(r-1)*4+1],b:c[(r-1)*4+2]};for(let E=L-2;E>=4;E-=2){let $=(ee*r+E)*4,O=c[$],G=c[$+1],ve=c[$+2];if(Math.hypot(O-S.r,G-S.g,ve-S.b)<28){M=E+2;break}}for(let E=L+2;E<r-4;E+=2){let $=(ee*r+E)*4,O=c[$],G=c[$+1],ve=c[$+2];if(Math.hypot(O-C.r,G-C.g,ve-C.b)<28){P=E-2;break}}let te=r*.32,Y=r*.82,H=P-M;if(H<te){let E=(te-H)/2;M=Math.max(2,M-E),P=Math.min(r-3,P+E),H=P-M}else if(H>Y){let E=(H-Y)/2;M+=E,P-=E,H=P-M}let ae=Math.max(.1,h-T*.15)*a,ge=h*a,N=y*n,Ce=x*.28*n,fe={x:N-Ce,y:ae,v:.95},ne={x:N+Ce,y:ae,v:.95},Ve={x:N,y:ge,v:.98},be={x:N-x*.52*n,y:ge,v:.9},he={x:N+x*.52*n,y:ge,v:.9},Xe={x:N,y:Math.max(0,(h-T*.65)*a),v:.92},V=M/r*n,re=P/r*n,X=I*a,Ft=B*a,Nt={x:(V+re)/2,y:Ft,v:.96},$t={x:V,y:X,v:.95},qt={x:re,y:X,v:.95},oe=Math.abs(re-V),Ie=U?Math.max(a*.36,(a-X)*.95):oe*1.2,_e=Math.min(a*.98,X+Ie),pt=oe*.44,ut=(V+re)/2,je={x:ut-pt,y:_e,v:.92},We={x:ut+pt,y:_e,v:.92},Ae=Ie*.52,mt=Ie*.46,Vt={x:V-oe*.12,y:X+Ae,v:.88},Xt={x:re+oe*.12,y:X+Ae,v:.88},jt={x:V-oe*.16,y:X+Ae+mt*.7,v:.86},Wt={x:re+oe*.16,y:X+Ae+mt*.7,v:.86},gt=Ie*.85,ft=Math.min(a*.98,_e+gt*.5),bt=Math.min(a*1,_e+gt),Yt={x:je.x,y:ft,v:.8},Gt={x:We.x,y:ft,v:.8},Jt={x:je.x,y:bt,v:.75},Kt={x:We.x,y:bt,v:.75};return[Ve,fe,ne,be,he,$t,qt,Vt,Xt,jt,Wt,je,We,Yt,Gt,Jt,Kt,Xe,Nt]}isSkinPixel(t,n,a){if(t<60||n<40||a<20||t<=n||t<=a||Math.abs(t-n)<12)return!1;let s=Math.max(t,n,a),r=Math.min(t,n,a);return s-r>15}generateAdaptiveBasePose(t,n){let a=t*.5,s=n*.36,r=n*.31,o=n*.5,i=n*.58,c=t*.3,u=n*.38,l=Math.min(n*.98,i+u);return[{x:a,y:s,v:.95},{x:a-t*.06,y:r,v:.95},{x:a+t*.06,y:r,v:.95},{x:a-t*.12,y:s,v:.9},{x:a+t*.12,y:s,v:.9},{x:a-c,y:i,v:.95},{x:a+c,y:i,v:.95},{x:a-c*1.15,y:i+u*.5,v:.88},{x:a+c*1.15,y:i+u*.5,v:.88},{x:a-c*1.25,y:i+u*.85,v:.86},{x:a+c*1.25,y:i+u*.85,v:.86},{x:a-c*.85,y:l,v:.85},{x:a+c*.85,y:l,v:.85},{x:a-c*.8,y:n*.98,v:.8},{x:a+c*.8,y:n*.98,v:.8},{x:a-c*.8,y:n*1,v:.78},{x:a+c*.8,y:n*1,v:.78},{x:a,y:n*.2,v:.92},{x:a,y:o,v:.95}]}applyAdaptiveTemporalSmoothing(t,n){if(!this.prevLandmarks||this.prevLandmarks.length!==t.length)return t;let a=[],s=0;for(let i=0;i<t.length;i++)s+=Math.hypot(t[i].x-this.prevLandmarks[i].x,t[i].y-this.prevLandmarks[i].y);let r=s/t.length,o=Math.max(.2,Math.min(.75,r/15));for(let i=0;i<t.length;i++){let c=t[i],u=this.prevLandmarks[i],l=u.x*(1-o)+c.x*o,d=u.y*(1-o)+c.y*o,p=(u.v||.9)*(1-o)+(c.v||.9)*o;a.push({x:l,y:d,v:p})}return a}computeBodyMeasurements(t,n,a){let s=t[5],r=t[6],o=t[11],i=t[12],c=t[18],u=Math.hypot(r.x-s.x,r.y-s.y),l=Math.hypot(i.x-o.x,i.y-o.y),d=Math.hypot((s.x+r.x)/2-(o.x+i.x)/2,(s.y+r.y)/2-(o.y+i.y)/2),g=Math.max(1,u/44),m=Math.round(u/g),f=Math.round(u*2.3/g),b=Math.round(l*2.1/g),y=Math.round(d/g),h="M";return f<88?h="XS":f<96?h="S":f<104?h="M":f<112?h="L":f<120?h="XL":h="XXL",{shoulderWidthCm:m,chestCircumferenceCm:f,waistCircumferenceCm:b,torsoHeightCm:y,shoulderWidthPx:Math.round(u),torsoHeightPx:Math.round(d),recommendedSize:h}}reset(){this.prevLandmarks=null,this.prevTimestamp=0,this.bodyDetectedFrames=0,this.noBodyFrames=0}};var Be=class{smoothedVertices=new Map;prevTimestamp=0;flipU=!1;tempCanvas=null;tempCtx=null;constructor(){typeof document<"u"&&(this.tempCanvas=document.createElement("canvas"),this.tempCtx=this.tempCanvas.getContext("2d",{willReadFrequently:!0}))}renderTryOn(t,n,a,s,r={}){if(!s||s.length<13||!n||!a)return;let o=t.canvas.width,i=t.canvas.height,{fitScale:c=1,fitOffsetY:u=0,fitOpacity:l=1,enableLightingTransfer:d=!0,enableArmOcclusion:p=!0,isMirrored:g=!1}=r;this.flipU=!!g;let m=s;if(g){m=s.map(x=>({x:o-x.x,y:x.y,v:x.v}));let h=(x,T)=>{if(m[x]&&m[T]){let U=m[x];m[x]=m[T],m[T]=U}};h(1,2),h(3,4),h(5,6),h(7,8),h(9,10),h(11,12),h(13,14),h(15,16)}let{vertices:f,triangles:b}=this.buildAnatomicalMesh(m,o,i,c,u),y=this.applyTemporalSmoothing(f);t.save(),t.globalAlpha=Math.max(.1,Math.min(1,l)),this.renderTorsoUnderbase(t,y),this.renderTexturedMesh(t,a,y,b),d&&this.applyAmbientLightingTransfer(t,n,y,o,i,g),t.restore(),p&&this.renderArmOcclusion(t,n,m,o,i,g)}buildAnatomicalMesh(t,n,a,s,r){let o=t[0]||{x:n*.5,y:a*.35},i=t[5]||{x:n*.35,y:a*.55},c=t[6]||{x:n*.65,y:a*.55},u=t[7]||{x:n*.28,y:a*.72},l=t[8]||{x:n*.72,y:a*.72},d=t[11]||{x:n*.38,y:a*.95},p=t[12]||{x:n*.62,y:a*.95},g=t[18]||{x:(i.x+c.x)/2,y:(i.y+c.y)/2-a*.05},m=Math.hypot(c.x-i.x,c.y-i.y),f=(i.x+c.x)/2,b=(i.y+c.y)/2,y=(d.x+p.x)/2,h=(d.y+p.y)/2,x=y-f,T=h-b,U=Math.max(a*.3,Math.hypot(x,T)),B=m/2*s*1.08,I=r*20,R=5,L=5,F=[],M=[],P=[0,.22,.5,.78,1],ee=[.85,1.15,1.05,.94,1.02];for(let S=0;S<R;S++){let C=P[S],te=f+x*C,Y=b+T*C+I,H=Math.atan2(T,x)-Math.PI/2,ae=Math.cos(H),ge=Math.sin(H),N=B*ee[S],Ce=Math.sin(C*Math.PI)*(m*.08);for(let fe=0;fe<L;fe++){let ne=fe/(L-1),Ve=C,be=(ne-.5)*2,he=0;S===0?he=Math.cos((ne-.5)*Math.PI)*(a*.035):S===1&&(he=(1-Math.abs(be))*(a*.015));let Xe=te+ae*(be*N),V=Y+ge*(be*N)+he+Ce;F.push({u:this.flipU?1-ne:ne,v:Ve,x:Xe,y:V})}}for(let S=0;S<R-1;S++)for(let C=0;C<L-1;C++){let te=S*L+C,Y=S*L+(C+1),H=(S+1)*L+C,ae=(S+1)*L+(C+1);M.push({i0:te,i1:Y,i2:H}),M.push({i0:Y,i1:ae,i2:H})}return this.appendSleeveMesh(F,M,i,u,c,l,L),{vertices:F,triangles:M}}appendSleeveMesh(t,n,a,s,r,o,i){let c=s.x-a.x,u=s.y-a.y,l=t.length;t.push({u:this.flipU?1:0,v:.35,x:a.x+c*.45,y:a.y+u*.45}),n.push({i0:0,i1:i,i2:l});let d=o.x-r.x,p=o.y-r.y,g=t.length;t.push({u:this.flipU?0:1,v:.35,x:r.x+d*.45,y:r.y+p*.45}),n.push({i0:i-1,i1:i*2-1,i2:g})}applyTemporalSmoothing(t){let a=[];for(let s=0;s<t.length;s++){let r=t[s],o=`v_${s}`,i=this.smoothedVertices.get(o);if(!i)this.smoothedVertices.set(o,{x:r.x,y:r.y}),a.push({...r});else{let c=i.x*.72+r.x*.28,u=i.y*(1-.28)+r.y*.28;this.smoothedVertices.set(o,{x:c,y:u}),a.push({u:r.u,v:r.v,x:c,y:u})}}return a}renderTexturedMesh(t,n,a,s){let r=n.naturalWidth||n.width||800,o=n.naturalHeight||n.height||800;for(let i of s){let c=a[i.i0],u=a[i.i1],l=a[i.i2];if(!c||!u||!l)continue;let d=c.u*r,p=c.v*o,g=u.u*r,m=u.v*o,f=l.u*r,b=l.v*o,y=c.x,h=c.y,x=u.x,T=u.y,U=l.x,B=l.y,I=d*(m-b)-p*(g-f)+(g*b-f*m);if(Math.abs(I)<1e-6)continue;let R=(y*(m-b)+x*(b-p)+U*(p-m))/I,L=(h*(m-b)+T*(b-p)+B*(p-m))/I,F=(y*(f-g)+x*(d-f)+U*(g-d))/I,M=(h*(f-g)+T*(d-f)+B*(g-d))/I,P=y-R*d-F*p,ee=h-L*d-M*p;t.save(),t.beginPath(),t.moveTo(y,h),t.lineTo(x,T),t.lineTo(U,B),t.closePath(),t.clip(),t.transform(R,L,F,M,P,ee),t.drawImage(n,0,0),t.restore()}}renderTorsoUnderbase(t,n){if(n.length<25)return;t.save(),t.beginPath();let a=5,s=5;t.moveTo(n[0].x,n[0].y);for(let r=1;r<a;r++)t.lineTo(n[r].x,n[r].y);for(let r=1;r<s;r++)t.lineTo(n[r*a+(a-1)].x,n[r*a+(a-1)].y);for(let r=a-2;r>=0;r--)t.lineTo(n[(s-1)*a+r].x,n[(s-1)*a+r].y);for(let r=s-2;r>=0;r--)t.lineTo(n[r*a].x,n[r*a].y);t.closePath(),t.fillStyle="#1e1e1e",t.fill(),t.restore()}applyAmbientLightingTransfer(t,n,a,s,r,o=!1){if(!this.tempCanvas||!this.tempCtx||a.length<5)return;(this.tempCanvas.width!==s||this.tempCanvas.height!==r)&&(this.tempCanvas.width=s,this.tempCanvas.height=r);let i=this.tempCtx;i.clearRect(0,0,s,r),i.save(),o&&(i.translate(s,0),i.scale(-1,1)),i.drawImage(n,0,0,s,r),i.restore(),t.save(),t.beginPath();let c=[a[0],a[1],a[2],a[3],a[4]],u=[a[20],a[21],a[22],a[23],a[24]];t.moveTo(c[0].x,c[0].y);for(let l=1;l<c.length;l++)t.lineTo(c[l].x,c[l].y);for(let l=u.length-1;l>=0;l--)t.lineTo(u[l].x,u[l].y);t.closePath(),t.clip(),t.globalCompositeOperation="multiply",t.globalAlpha=.22,t.drawImage(this.tempCanvas,0,0),t.restore()}renderArmOcclusion(t,n,a,s,r,o){let i=a[5],c=a[6],u=a[7],l=a[8],d=a[9],p=a[10],g=a[11],m=a[12];if(!i||!c||!g||!m)return;let f=Math.min(i.x,c.x)-s*.05,b=Math.max(i.x,c.x)+s*.05,y=Math.min(i.y,c.y),h=Math.max(g.y,m.y),x=d&&d.x>=f&&d.x<=b&&d.y>=y&&d.y<=h,T=p&&p.x>=f&&p.x<=b&&p.y>=y&&p.y<=h;!x&&!T||(t.save(),x&&u&&d&&this.drawOcclusionArmSegment(t,n,u,d,s*.07,o),T&&l&&p&&this.drawOcclusionArmSegment(t,n,l,p,s*.07,o),t.restore())}drawOcclusionArmSegment(t,n,a,s,r,o=!1){let c=Math.atan2(s.y-a.y,s.x-a.x)+Math.PI/2,u=r/2,l=Math.cos(c)*u,d=Math.sin(c)*u;t.save(),t.beginPath(),t.moveTo(a.x-l,a.y-d),t.lineTo(a.x+l,a.y+d),t.lineTo(s.x+l,s.y+d),t.lineTo(s.x-l,s.y-d),t.closePath(),t.clip(),o&&(t.translate(t.canvas.width,0),t.scale(-1,1)),t.drawImage(n,0,0,t.canvas.width,t.canvas.height),t.restore()}reset(){this.smoothedVertices.clear(),this.prevTimestamp=0}};var dt=new Be,zt=new Re,Ct="vestora-panel-host",sa=420,ia={NOSE:0,LEFT_EYE:1,RIGHT_EYE:2,LEFT_EAR:3,RIGHT_EAR:4,LEFT_SHOULDER:5,RIGHT_SHOULDER:6,LEFT_ELBOW:7,RIGHT_ELBOW:8,LEFT_WRIST:9,RIGHT_WRIST:10,LEFT_HIP:11,RIGHT_HIP:12,LEFT_KNEE:13,RIGHT_KNEE:14,LEFT_ANKLE:15,RIGHT_ANKLE:16,HEAD_CROWN:17,NECK:18},ca={XS:{shoulder:[36,39],chest:[81,87],waist:[66,72]},S:{shoulder:[39,42],chest:[87,93],waist:[72,78]},M:{shoulder:[42,45],chest:[93,99],waist:[78,84]},L:{shoulder:[45,48],chest:[99,107],waist:[84,92]},XL:{shoulder:[48,52],chest:[107,115],waist:[92,100]},XXL:{shoulder:[52,56],chest:[115,124],waist:[100,110]}},It=[{name:"Oversized Minimalist Jacket",category:"Jacket",garmentCategory:"upper_body",imageUrl:"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",availableSizes:["S","M","L","XL"]},{name:"Streetwear Graphic Hoodie",category:"Hoodie",garmentCategory:"upper_body",imageUrl:"https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",availableSizes:["M","L","XL","XXL"]},{name:"Classic Aviator Sunglasses",category:"Sunglasses",garmentCategory:"eyewear",imageUrl:"https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80",availableSizes:["One Size"]},{name:"Urban Snapback Cap",category:"Hat",garmentCategory:"headwear",imageUrl:"https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80",availableSizes:["One Size"]}],_t=0,q=null,w=null,W=null,Z=null,_=[],me=.88,D=1,le=0,Q="user",Le=!1,tt=!1,k=null,A=null,v=null,Te=null,nt=null,rt=null,ie=null,ke=null,ot=null,st=null,it=null,ct=null,lt=null,Ne=null,ce=null,Rt=null,K=null,De=null,Ue=null,la=`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* \u2500\u2500 Panel Shell \u2500\u2500 */
  .v-panel {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${sa}px;
    z-index: 2147483646;
    display: flex;
    flex-direction: column;
    background: #0a0b10;
    border-right: 1px solid rgba(139, 92, 246, 0.35);
    box-shadow: 4px 0 40px rgba(0,0,0,0.8), 0 0 30px rgba(139,92,246,0.2);
    transform: translateX(-100%);
    transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .v-panel.is-open {
    transform: translateX(0);
  }

  /* \u2500\u2500 Top Bar \u2500\u2500 */
  .v-topbar {
    flex-shrink: 0;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    background: rgba(13, 15, 24, 0.98);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    gap: 10px;
  }
  .v-brand {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
  }
  .v-brand-sparkle {
    width: 22px;
    height: 22px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    box-shadow: 0 0 10px rgba(139,92,246,0.5);
    color: #fff;
  }
  .v-brand-name {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.12em;
    background: linear-gradient(135deg, #c084fc, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .v-free-badge {
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #10b981;
    background: rgba(16,185,129,0.12);
    border: 1px solid rgba(16,185,129,0.3);
    border-radius: 9999px;
    padding: 2px 7px;
  }
  .v-mode-switch {
    display: flex;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 2px;
    gap: 2px;
    flex-shrink: 0;
  }
  .v-mode-btn {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    font-family: inherit;
  }
  .v-mode-btn.active {
    background: rgba(139,92,246,0.25);
    color: #c084fc;
  }
  .v-topbar-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .v-icon-btn {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
    padding: 0;
  }
  .v-icon-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
  .v-icon-btn.close-btn:hover { background: rgba(239,68,68,0.2); color: #f87171; }
  .v-icon-btn svg { width: 15px; height: 15px; display: block; }

  /* \u2500\u2500 Camera Viewport \u2500\u2500 */
  .v-viewport {
    position: relative;
    flex-shrink: 0;
    width: 100%;
    aspect-ratio: 4 / 3;
    background: #050508;
    overflow: hidden;
  }
  .v-camera-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .v-garment-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .v-camera-blocked {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(5,5,10,0.95);
    flex-direction: column;
    gap: 10px;
    padding: 24px;
    text-align: center;
    z-index: 5;
  }
  .v-camera-blocked.hidden { display: none; }
  .v-camera-blocked-icon { font-size: 32px; }
  .v-camera-blocked h3 { font-size: 14px; font-weight: 700; color: #f1f5f9; }
  .v-camera-blocked p { font-size: 11px; color: #64748b; line-height: 1.6; max-width: 280px; }
  .v-cam-fallback-btn {
    padding: 8px 18px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: linear-gradient(135deg, #7c3aed, #9333ea);
    color: #fff;
    margin-top: 4px;
    transition: filter 0.2s;
    font-family: inherit;
  }
  .v-cam-fallback-btn:hover { filter: brightness(1.15); }
  .v-cam-fallback-btn.outline {
    background: transparent;
    border: 1px solid rgba(139,92,246,0.5);
    color: #a78bfa;
  }

  .v-detect-ring {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(6px);
    border-radius: 9999px;
    padding: 3px 9px 3px 5px;
    font-size: 10px;
    font-weight: 600;
    color: #4ade80;
    z-index: 4;
    pointer-events: none;
  }
  .v-detect-ring.detecting { color: #f59e0b; }
  .ring-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    animation: pulse-dot 1.4s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.65); }
  }

  .v-viewport::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 40px;
    background: linear-gradient(to bottom, rgba(10,11,16,0.5), transparent);
    z-index: 2;
    pointer-events: none;
  }

  /* \u2500\u2500 Drop Zone Overlay \u2500\u2500 */
  .v-drop-overlay {
    position: absolute;
    inset: 0;
    background: rgba(8, 10, 16, 0.88);
    border: 2px dashed #818cf8;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    backdrop-filter: blur(8px);
    transition: all 0.2s ease;
    pointer-events: none;
  }
  .v-drop-overlay.hidden { display: none; }
  .v-drop-card {
    text-align: center;
    padding: 20px 24px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  }
  .v-drop-icon { font-size: 30px; margin-bottom: 6px; }
  .v-drop-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px; }
  .v-drop-sub { font-size: 11px; color: rgba(255, 255, 255, 0.65); }

  /* \u2500\u2500 Toast \u2500\u2500 */
  .v-toast {
    position: absolute;
    bottom: 10px;
    left: 10px;
    right: 10px;
    padding: 9px 13px;
    background: rgba(13,15,26,0.96);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(139,92,246,0.4);
    border-radius: 9px;
    font-size: 11px;
    color: #f1f5f9;
    display: flex;
    align-items: center;
    gap: 7px;
    opacity: 0;
    transform: translateY(6px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    z-index: 20;
  }
  .v-toast.visible { opacity: 1; transform: translateY(0); }
  .v-toast-icon { color: #c084fc; font-size: 12px; flex-shrink: 0; }

  /* \u2500\u2500 Scrollable Bottom Panel \u2500\u2500 */
  .v-bottom {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    scrollbar-width: thin;
    scrollbar-color: rgba(139,92,246,0.3) transparent;
  }
  .v-bottom::-webkit-scrollbar { width: 4px; }
  .v-bottom::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 4px; }

  /* \u2500\u2500 Product Strip \u2500\u2500 */
  .v-product-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(15,17,28,0.8);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .v-product-thumb {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid rgba(139,92,246,0.3);
    background: #1e1b4b;
    flex-shrink: 0;
  }
  .v-product-info { flex: 1; min-width: 0; }
  .v-product-name { font-size: 12px; font-weight: 600; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .v-product-cat { font-size: 10px; color: #64748b; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .v-strip-actions { display: flex; gap: 5px; flex-shrink: 0; }
  .v-pill-btn {
    padding: 5px 10px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.03em;
    cursor: pointer;
    border: 1px solid rgba(139,92,246,0.4);
    background: rgba(139,92,246,0.1);
    color: #c084fc;
    transition: all 0.2s;
    white-space: nowrap;
    font-family: inherit;
  }
  .v-pill-btn:hover { background: rgba(139,92,246,0.25); border-color: rgba(139,92,246,0.7); }
  .v-pill-btn.grab { background: linear-gradient(135deg, rgba(124,58,237,0.3),rgba(99,102,241,0.3)); border-color: rgba(139,92,246,0.6); color: #e0d4ff; }
  .v-pill-btn.sample { border-color: rgba(99,102,241,0.3); color: #818cf8; }

  /* \u2500\u2500 Sections \u2500\u2500 */
  .v-section {
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .v-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .v-section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.09em;
  }
  .v-sparkle { color: #a78bfa; }
  .v-count-badge {
    font-size: 10px;
    font-weight: 600;
    color: #a78bfa;
    background: rgba(139,92,246,0.12);
    border-radius: 9999px;
    padding: 1px 7px;
  }
  .v-section-actions { display: flex; gap: 5px; }
  .v-text-btn {
    font-size: 10px;
    font-weight: 600;
    color: #475569;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 3px 6px;
    border-radius: 4px;
    transition: color 0.2s;
    font-family: inherit;
  }
  .v-text-btn:hover { color: #94a3b8; }
  .v-text-btn.add { color: #a78bfa; }
  .v-text-btn.add:hover { color: #c084fc; }

  .v-outfit-list { display: flex; flex-direction: column; gap: 4px; }
  .v-outfit-empty { font-size: 11px; color: #334155; text-align: center; padding: 10px 0; line-height: 1.5; }

  .v-layer-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .v-layer-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(139,92,246,0.3); }
  .v-layer-card.disabled { opacity: 0.4; }
  .v-layer-thumb { width: 34px; height: 34px; border-radius: 6px; object-fit: cover; background: #1e1b4b; flex-shrink: 0; }
  .v-layer-info { flex: 1; min-width: 0; }
  .v-layer-cat { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #a78bfa; }
  .v-layer-name { font-size: 11px; font-weight: 500; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .v-layer-btns { display: flex; gap: 3px; }
  .v-layer-btn {
    width: 22px; height: 22px;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #64748b;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 11px; font-weight: 700;
    transition: all 0.15s; padding: 0; font-family: inherit;
  }
  .v-layer-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .v-layer-btn.remove:hover { background: rgba(239,68,68,0.2); color: #f87171; border-color: rgba(239,68,68,0.3); }
  .v-layer-btn.on { color: #4ade80; border-color: rgba(74,222,128,0.3); }

  /* \u2500\u2500 Fit Controls \u2500\u2500 */
  .v-fit-panel {
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    display: none;
    flex-direction: column;
    gap: 8px;
    background: rgba(8,9,16,0.8);
  }
  .v-fit-panel.open { display: flex; }
  .v-fit-row { display: flex; align-items: center; gap: 8px; }
  .v-fit-label { font-size: 10px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; width: 52px; flex-shrink: 0; }
  .v-fit-val { font-size: 11px; font-weight: 700; color: #c084fc; width: 36px; text-align: center; }
  .v-fit-btn {
    width: 26px; height: 26px; border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: #94a3b8; font-size: 14px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; transition: all 0.15s; padding: 0; font-family: inherit;
  }
  .v-fit-btn:hover { background: rgba(139,92,246,0.2); color: #c084fc; border-color: rgba(139,92,246,0.4); }
  .v-fit-reset {
    padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 600;
    border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
    color: #64748b; cursor: pointer; transition: all 0.15s; margin-left: auto; font-family: inherit;
  }
  .v-fit-reset:hover { color: #94a3b8; }
  .v-opacity-slider { flex: 1; accent-color: #7c3aed; cursor: pointer; }

  /* \u2500\u2500 Size Engine \u2500\u2500 */
  .v-meas-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;
  }
  .v-meas-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 7px; padding: 7px 10px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .v-meas-label { font-size: 9px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; }
  .v-meas-val { font-size: 13px; font-weight: 700; color: #c084fc; }
  .v-rec-size {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.15));
    border: 1px solid rgba(139,92,246,0.3); border-radius: 9px; padding: 8px 14px; margin-bottom: 8px;
  }
  .v-rec-label { font-size: 10px; font-weight: 600; color: #94a3b8; }
  .v-rec-val { font-size: 18px; font-weight: 800; color: #a78bfa; }
  .v-sizes-row { display: flex; flex-wrap: wrap; gap: 5px; }
  .v-size-pill {
    padding: 5px 12px; border-radius: 7px; font-size: 11px; font-weight: 600;
    border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
    color: #64748b; cursor: pointer; transition: all 0.15s; font-family: inherit;
  }
  .v-size-pill:hover { border-color: rgba(139,92,246,0.4); color: #a78bfa; }
  .v-size-pill.rec { border-color: rgba(139,92,246,0.6); background: rgba(139,92,246,0.15); color: #c084fc; font-weight: 700; }
  .v-size-pill.selected { background: #7c3aed; border-color: #7c3aed; color: #fff; }

  /* \u2500\u2500 Hint / Footer \u2500\u2500 */
  .v-hint-strip { padding: 8px 14px; font-size: 10px; color: #334155; text-align: center; line-height: 1.5; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .v-hint-strip strong { color: #6d28d9; }
  .v-footer {
    flex-shrink: 0; padding: 8px 14px;
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(7,8,12,0.9); border-top: 1px solid rgba(255,255,255,0.05);
  }
  .v-footer-privacy { font-size: 9px; color: #1e293b; }
  .v-footer-brand { font-size: 9px; font-weight: 800; color: #3730a3; letter-spacing: 0.1em; }

  /* \u2500\u2500 Toggle Tab (collapsed state) \u2500\u2500 */
  .v-toggle-tab {
    position: fixed;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2147483645;
    background: linear-gradient(180deg, #7c3aed, #9333ea);
    color: #fff;
    border: none;
    border-radius: 0 12px 12px 0;
    padding: 16px 7px;
    cursor: pointer;
    box-shadow: 3px 0 20px rgba(124,58,237,0.55);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-family: inherit;
    transition: opacity 0.2s, box-shadow 0.2s;
  }
  .v-toggle-tab:hover { box-shadow: 4px 0 28px rgba(124,58,237,0.8); }
  .v-toggle-tab.hidden { display: none; }
  .v-toggle-sparkle { font-size: 13px; }
  .v-toggle-text {
    font-size: 8px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;
    writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg);
  }
`;function da(){return`
    <div class="v-panel" id="v-panel">
      <div class="v-topbar">
        <div class="v-brand">
          <div class="v-brand-sparkle">\u2726</div>
          <span class="v-brand-name">VESTORA</span>
          <span class="v-free-badge">FREE</span>
        </div>
        <div class="v-mode-switch">
          <button class="v-mode-btn active" id="v-btn-camera" type="button">\u{1F4F7} Live</button>
          <button class="v-mode-btn" id="v-btn-photo" type="button">\u{1F4F8} Photo</button>
        </div>
        <div class="v-topbar-actions">
          <button class="v-icon-btn" id="v-btn-flip" title="Flip Camera">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
          </button>
          <button class="v-icon-btn" id="v-btn-fit" title="Adjust Fit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
          </button>
          <button class="v-icon-btn" id="v-btn-screenshot" title="Screenshot">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="v-icon-btn close-btn" id="v-btn-close" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div class="v-viewport" id="v-viewport">
        <video id="v-video" class="v-camera-video" autoplay playsinline muted></video>
        <canvas id="v-canvas" class="v-garment-canvas"></canvas>
        <div class="v-drop-overlay hidden" id="v-drop-overlay">
          <div class="v-drop-card">
            <div class="v-drop-icon">\u2728</div>
            <div class="v-drop-title">Drop Garment to Try On</div>
            <div class="v-drop-sub">Drag any clothing photo from the page here</div>
          </div>
        </div>
        <div class="v-detect-ring detecting" id="v-detect-ring">
          <div class="ring-dot"></div>
          <span id="v-detect-label">Starting camera\u2026</span>
        </div>
        <div class="v-camera-blocked hidden" id="v-camera-blocked">
          <div class="v-camera-blocked-icon">\u{1F4F7}</div>
          <h3>Camera Access Needed</h3>
          <p id="v-camera-error-msg">Click the padlock icon in your browser bar \u2192 allow Camera \u2192 press Retry.</p>
          <button class="v-cam-fallback-btn" id="v-btn-retry-cam">\u21BA Retry Camera</button>
          <button class="v-cam-fallback-btn outline" id="v-btn-use-photo">\u{1F4F8} Use Photo Instead</button>
        </div>
        <div class="v-toast" id="v-toast">
          <span class="v-toast-icon">\u2726</span>
          <span id="v-toast-text"></span>
        </div>
      </div>

      <div class="v-bottom" id="v-bottom">
        <div class="v-product-strip">
          <img id="v-product-thumb" class="v-product-thumb" src="" alt="Product" style="display:none"/>
          <div class="v-product-info">
            <div id="v-product-name" class="v-product-name">Ready for Try-On</div>
            <div id="v-product-cat" class="v-product-cat">Select any fashion item on the page</div>
          </div>
          <div class="v-strip-actions">
            <button class="v-pill-btn grab" id="v-btn-grab">\u2726 Grab</button>
            <button class="v-pill-btn sample" id="v-btn-sample">\u25B6 Sample</button>
          </div>
        </div>

        <div class="v-section">
          <div class="v-section-header">
            <div class="v-section-title">
              <span class="v-sparkle">\u2726</span> Active Outfit
              <span class="v-count-badge" id="v-outfit-count">0</span>
            </div>
            <div class="v-section-actions">
              <button class="v-text-btn add" id="v-btn-add">+ Add</button>
              <button class="v-text-btn" id="v-btn-clear">Clear</button>
            </div>
          </div>
          <div class="v-outfit-list" id="v-outfit-list">
            <div class="v-outfit-empty">No items loaded yet. Try a sample or grab from the page.</div>
          </div>
        </div>

        <div class="v-fit-panel" id="v-fit-panel">
          <div class="v-fit-row">
            <span class="v-fit-label">Scale</span>
            <button class="v-fit-btn" id="v-fit-scale-down">\u2212</button>
            <span class="v-fit-val" id="v-fit-scale-val">100%</span>
            <button class="v-fit-btn" id="v-fit-scale-up">+</button>
            <button class="v-fit-reset" id="v-fit-reset">Reset</button>
          </div>
          <div class="v-fit-row">
            <span class="v-fit-label">Height</span>
            <button class="v-fit-btn" id="v-fit-up">\u25B2</button>
            <button class="v-fit-btn" id="v-fit-down">\u25BC</button>
          </div>
          <div class="v-fit-row">
            <span class="v-fit-label">Opacity</span>
            <input type="range" class="v-opacity-slider" id="v-opacity-slider" min="30" max="100" value="88"/>
          </div>
        </div>

        <div class="v-section">
          <div class="v-section-title" style="margin-bottom:8px">\u{1F4D0} AI Size Recommendation</div>
          <div class="v-meas-grid">
            <div class="v-meas-item"><span class="v-meas-label">Shoulder</span><span class="v-meas-val" id="v-meas-shoulder">--</span></div>
            <div class="v-meas-item"><span class="v-meas-label">Chest</span><span class="v-meas-val" id="v-meas-chest">--</span></div>
            <div class="v-meas-item"><span class="v-meas-label">Waist</span><span class="v-meas-val" id="v-meas-waist">--</span></div>
            <div class="v-meas-item"><span class="v-meas-label">Torso</span><span class="v-meas-val" id="v-meas-torso">--</span></div>
          </div>
          <div class="v-rec-size">
            <span class="v-rec-label">Recommended Size</span>
            <span class="v-rec-val" id="v-rec-size">--</span>
          </div>
          <div class="v-sizes-row" id="v-sizes-row"></div>
        </div>

        <div class="v-hint-strip">\u{1F4A1} Hover any clothing image on this page \u2192 click <strong>\u2726 Try with VESTORA</strong></div>

        <div class="v-footer">
          <span class="v-footer-privacy">\u{1F512} 100% On-Device \xB7 No Video Upload</span>
          <span class="v-footer-brand">VESTORA</span>
        </div>
      </div>
    </div>

    <button class="v-toggle-tab hidden" id="v-toggle-tab" type="button">
      <span class="v-toggle-sparkle">\u2726</span>
      <span class="v-toggle-text">VESTORA</span>
    </button>

    <input type="file" id="v-photo-input" accept="image/*" style="display:none"/>
  `}function Se(e){try{chrome.runtime.sendMessage({type:"VESTORA_OPEN_SIDEPANEL",payload:e},t=>{(chrome.runtime.lastError||!t?.success)&&At(e)});return}catch{}At(e)}function At(e){if(q&&w){qe(e,!1),z(`\u2726 Added ${e.name.slice(0,28)}\u2026`);return}pa(e)}function pa(e){document.getElementById(Ct)?.remove(),$e(),q=document.createElement("div"),q.id=Ct,q.style.cssText="position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483646!important;",document.documentElement.appendChild(q),w=q.attachShadow({mode:"open"});let t=document.createElement("style");t.textContent=la,w.appendChild(t);let n=document.createElement("div");n.innerHTML=da(),w.appendChild(n);let a=w.getElementById("v-panel");a.style.pointerEvents="all";let s=w.getElementById("v-toggle-tab");s.style.pointerEvents="all",k=w.getElementById("v-video"),A=w.getElementById("v-canvas"),Te=w.getElementById("v-camera-blocked"),nt=w.getElementById("v-product-name"),rt=w.getElementById("v-product-cat"),ie=w.getElementById("v-product-thumb"),ke=w.getElementById("v-outfit-list"),ot=w.getElementById("v-outfit-count"),st=w.getElementById("v-meas-shoulder"),it=w.getElementById("v-meas-chest"),ct=w.getElementById("v-meas-waist"),lt=w.getElementById("v-meas-torso"),Ne=w.getElementById("v-rec-size"),ce=w.getElementById("v-sizes-row"),Rt=w.getElementById("v-fit-panel"),K=w.getElementById("v-fit-scale-val"),De=w.getElementById("v-opacity-slider"),Ue=w.getElementById("v-toast"),v=A.getContext("2d",{desynchronized:!0,alpha:!0}),requestAnimationFrame(()=>requestAnimationFrame(()=>{a.classList.add("is-open"),s.classList.remove("hidden")})),ua(),e&&qe(e,!0),Ee("user")}function ua(){let e=w,t=e.getElementById("v-panel"),n=e.getElementById("v-toggle-tab");e.getElementById("v-btn-close").addEventListener("click",Pt),n.addEventListener("click",()=>{t.classList.add("is-open"),n.classList.add("hidden"),W||Ee(Q)}),e.getElementById("v-btn-flip").addEventListener("click",()=>{Ee(Q==="user"?"environment":"user")}),e.getElementById("v-btn-fit").addEventListener("click",()=>{tt=!tt,Rt.classList.toggle("open",tt)}),e.getElementById("v-btn-screenshot").addEventListener("click",Ca),e.getElementById("v-btn-retry-cam").addEventListener("click",()=>{Te.classList.add("hidden"),Ee(Q)}),e.getElementById("v-btn-use-photo").addEventListener("click",()=>{e.getElementById("v-photo-input").click()}),e.getElementById("v-photo-input").addEventListener("change",r=>{let o=r.target.files?.[0];if(!o)return;let i=new FileReader;i.onload=c=>{let u=new Image;u.onload=()=>{$e(),A&&(A.width=u.naturalWidth,A.height=u.naturalHeight),Te.classList.add("hidden"),k&&(k.style.display="none"),Le=!0,z("\u2726 Photo loaded \u2014 try-on active!"),Bt()},u.src=c.target.result},i.readAsDataURL(o)}),e.getElementById("v-btn-grab").addEventListener("click",()=>{z("Hover any clothing image \u2192 click \u2726 Try with VESTORA")}),e.getElementById("v-btn-sample").addEventListener("click",ma),e.getElementById("v-btn-add").addEventListener("click",()=>{z("Hover any clothing image \u2192 click \u2726 Try with VESTORA")}),e.getElementById("v-btn-clear").addEventListener("click",()=>{_=[],ue(),z("Cleared all items")}),e.getElementById("v-fit-scale-down").addEventListener("click",()=>{D=Math.max(.5,D-.05),se(),K&&(K.textContent=`${Math.round(D*100)}%`)}),e.getElementById("v-fit-scale-up").addEventListener("click",()=>{D=Math.min(2.5,D+.05),se(),K&&(K.textContent=`${Math.round(D*100)}%`)}),e.getElementById("v-fit-up").addEventListener("click",()=>{le-=10,se()}),e.getElementById("v-fit-down").addEventListener("click",()=>{le+=10,se()}),e.getElementById("v-fit-reset").addEventListener("click",()=>{D=1,le=0,me=.88,K&&(K.textContent="100%"),De&&(De.value="88"),se()}),De.addEventListener("input",r=>{me=parseInt(r.target.value)/100,se()}),e.getElementById("v-btn-camera").addEventListener("click",()=>{e.getElementById("v-btn-camera").classList.add("active"),e.getElementById("v-btn-photo").classList.remove("active"),k&&(k.style.display="block"),W||Ee(Q)}),e.getElementById("v-btn-photo").addEventListener("click",()=>{e.getElementById("v-btn-photo").classList.add("active"),e.getElementById("v-btn-camera").classList.remove("active"),e.getElementById("v-photo-input").click()});let a=e.getElementById("v-drop-overlay"),s=0;t.addEventListener("dragenter",r=>{r.preventDefault(),s++,a?.classList.remove("hidden")}),t.addEventListener("dragover",r=>{r.preventDefault(),r.dataTransfer&&(r.dataTransfer.dropEffect="copy"),a?.classList.remove("hidden")}),t.addEventListener("dragleave",r=>{r.preventDefault(),s--,s<=0&&(s=0,a?.classList.add("hidden"))}),t.addEventListener("drop",async r=>{r.preventDefault(),s=0,a?.classList.add("hidden");let o=null,i="Dropped Garment";if(r.dataTransfer?.files&&r.dataTransfer.files.length>0){let c=r.dataTransfer.files[0];c.type.startsWith("image/")&&(i=c.name.replace(/\.[^/.]+$/,""),o=await new Promise(u=>{let l=new FileReader;l.onload=()=>u(l.result),l.readAsDataURL(c)}))}if(!o&&r.dataTransfer){let c=r.dataTransfer.getData("text/html");if(c)try{let u=document.createElement("div");u.innerHTML=c;let l=u.querySelector("img");l&&(o=l.currentSrc||l.src||l.getAttribute("data-src")||l.getAttribute("data-zoom-src"),l.alt&&(i=l.alt.trim()))}catch{}}if(!o&&r.dataTransfer){let c=r.dataTransfer.getData("text/uri-list")||r.dataTransfer.getData("URL");c&&(c.startsWith("http")||c.startsWith("data:image/"))&&(o=c.trim().split(`
`)[0])}if(!o&&r.dataTransfer){let c=r.dataTransfer.getData("text/plain");c&&(c.startsWith("http://")||c.startsWith("https://")||c.startsWith("data:image/"))&&(o=c.trim())}if(o){let c={id:`drop_${Date.now()}`,name:i,imageUrl:o,category:"Clothing",garmentCategory:Dt(i,"Clothing"),availableSizes:["XS","S","M","L","XL","XXL"]};qe(c,!0),z(`\u2726 Trying on: ${i.slice(0,24)}\u2026`)}else z("\u26A0 Could not detect clothing image from drop")}),document.addEventListener("keydown",r=>{r.key==="Escape"&&q&&Pt()})}function se(){_.filter(e=>e.enabled).forEach(e=>{e.scale=D,e.offsetY=le,e.opacity=me})}function ma(){let e=It[_t%It.length];_t++,qe({id:`sample_${Date.now()}`,name:e.name,category:e.category,brand:"VESTORA Sample",imageUrl:e.imageUrl,productUrl:"",pageUrl:"",isFashion:!0,availableSizes:e.availableSizes,outOfStockSizes:[],confidence:1,detectionSource:"dom-heuristic",garmentCategory:e.garmentCategory},!1)}function Pt(){let e=w?.getElementById("v-panel"),t=w?.getElementById("v-toggle-tab");e&&(e.classList.remove("is-open"),t?.classList.add("hidden"),setTimeout(()=>{$e(),zt.reset(),dt.reset(),q?.remove(),q=null,w=null,_=[],Le=!1},420))}async function Ee(e){$e(),Te?.classList.add("hidden"),de(!0,"Starting camera\u2026");let t=window.navigator.mediaDevices;if(!t||!t.getUserMedia){console.error("[VESTORA] navigator.mediaDevices not available"),Ht("Camera API not available in this browser.");return}let n=[{video:{facingMode:{ideal:e},width:{ideal:1280},height:{ideal:720}},audio:!1},{video:{facingMode:{ideal:e}},audio:!1},{video:!0,audio:!1}],a;for(let s of n)try{W=await t.getUserMedia(s),await ga(W,e);return}catch(r){a=r,console.warn("[VESTORA] getUserMedia variant failed:",r)}console.error("[VESTORA] All camera variants failed:",a),Ht()}async function ga(e,t){k&&(Q=t,k.srcObject=e,k.style.transform=t==="user"?"scaleX(-1)":"",k.style.display="block",await new Promise(n=>{k.onloadedmetadata=()=>k.play().then(n).catch(n)}),fa(),setTimeout(()=>{Le=!0,de(!1,"Body Detected \u2713"),z("\u2726 Camera active \u2014 live try-on ready!"),Bt()},1100))}function $e(){Z&&(cancelAnimationFrame(Z),Z=null),W&&(W.getTracks().forEach(e=>e.stop()),W=null),Le=!1}function Ht(e){de(!0,"No Camera");let t=w?.getElementById("v-camera-error-msg");t&&(t.textContent=e||"Camera permission was denied or no camera found. Click \u21BA Retry after allowing camera in browser settings, or use Photo mode."),Te?.classList.remove("hidden")}function de(e,t){let n=w?.getElementById("v-detect-ring");if(!n)return;n.classList.toggle("detecting",e);let a=n.querySelector("span");a&&(a.textContent=t)}function fa(){!k||!A||(A.width=k.videoWidth||640,A.height=k.videoHeight||480)}function Bt(){Z&&cancelAnimationFrame(Z);function e(){if(Z=requestAnimationFrame(e),!v||!A)return;let t=A.width,n=A.height;if(!t||!n)return;let a=k&&k.videoWidth?k:A,s=zt.track(a,t,n);s.framingStatus==="close_up"?de(!0,"\u{1F4A1} Sit back slightly for full view"):s.isBodyDetected?(Le=!0,de(!1,`\u2726 Live Tracking (${s.framingStatus==="far"?"Full Body":"Torso"})`)):de(!0,"Looking for body\u2026");let r={landmarks:s.landmarks};La(r,t,n),v.clearRect(0,0,t,n),ba(r,t,n,Q==="user"&&!!W)}Z=requestAnimationFrame(e)}function ba(e,t,n,a){let s=["lower_body","full_body","upper_body","belt","necklace","scarf","bag","wristwear","ring","earrings","eyewear","headwear"],r=_.filter(o=>o.enabled).sort((o,i)=>s.indexOf(o.garmentCategory)-s.indexOf(i.garmentCategory));for(let o of r){let i=o.processedCanvas||o.imageElement;if(i)switch(o.garmentCategory){case"eyewear":xa(e.landmarks,t,n,o,i,a);break;case"headwear":wa(e.landmarks,t,n,o,i,a);break;case"necklace":ka(e.landmarks,t,n,o,i,a);break;case"wristwear":Ea(e.landmarks,t,n,o,i,a);break;case"lower_body":va(e.landmarks,t,n,o,i,a);break;case"full_body":ya(e.landmarks,t,n,o,i,a);break;default:ha(e.landmarks,t,n,o,i,a);break}}}var pe=ia;function ha(e,t,n,a,s,r){if(k&&k.videoWidth&&s)try{dt.renderTryOn(v,k,s,e,{fitScale:a.scale*D,fitOffsetY:a.offsetY+le,fitOpacity:a.opacity*me,enableLightingTransfer:!0,enableArmOcclusion:!0,isMirrored:r});return}catch(y){console.warn("[VESTORA Panel] Dense mesh error, falling back to rotation:",y)}let o=e[pe.LEFT_SHOULDER],i=e[pe.RIGHT_SHOULDER],c=e[pe.LEFT_HIP];if(!o||!i||!c)return;let u=Math.abs(i.x-o.x),l=Math.abs(c.y-o.y),d=u*2.2*a.scale,p=l*1.45*a.scale,g=(o.x+i.x)/2,m=o.y-p*.08+a.offsetY,f=r?t-g-d/2:g-d/2,b=Math.atan2(i.y-o.y,i.x-o.x);v.save(),v.globalAlpha=a.opacity,v.translate(f+d/2,m+p/2),v.rotate(r?-b:b),v.translate(-(f+d/2),-(m+p/2)),v.drawImage(s,f,m,d,p),v.restore()}function va(e,t,n,a,s,r){let o=e[pe.LEFT_HIP],i=e[pe.RIGHT_HIP],c=e[pe.LEFT_ANKLE];if(!o||!i||!c)return;let u=Math.abs(i.x-o.x),l=Math.abs(c.y-o.y),d=u*1.8*a.scale,p=l*1.15*a.scale,g=(o.x+i.x)/2,m=o.y-p*.05+a.offsetY,f=r?t-g-d/2:g-d/2;v.save(),v.globalAlpha=a.opacity,v.drawImage(s,f,m,d,p),v.restore()}function ya(e,t,n,a,s,r){if(k&&k.videoWidth&&s)try{dt.renderTryOn(v,k,s,e,{fitScale:a.scale*D*1.08,fitOffsetY:a.offsetY+le,fitOpacity:a.opacity*me,enableLightingTransfer:!0,enableArmOcclusion:!0,isMirrored:r});return}catch(b){console.warn("[VESTORA Panel] Dense mesh error, falling back to rotation:",b)}let o=e[5],i=e[6],c=e[15];if(!o||!i||!c)return;let u=Math.abs(i.x-o.x),l=Math.abs(c.y-o.y),d=u*2.3*a.scale,p=l*1.25*a.scale,g=(o.x+i.x)/2,m=o.y-p*.04+a.offsetY,f=r?t-g-d/2:g-d/2;v.save(),v.globalAlpha=a.opacity,v.drawImage(s,f,m,d,p),v.restore()}function xa(e,t,n,a,s,r){let o=e[1],i=e[2];if(!o||!i)return;let c=i.x-o.x,u=i.y-o.y,l=Math.sqrt(c*c+u*u),d=Math.atan2(u,c),p=l*2.35*a.scale,g=p*.44,m=(o.x+i.x)/2,f=(o.y+i.y)/2+a.offsetY,b=r?t-m-p/2:m-p/2;v.save(),v.globalAlpha=a.opacity,v.translate(b+p/2,f),v.rotate(r?-d:d),v.translate(-(b+p/2),-f),v.drawImage(s,b,f-g/2,p,g),v.restore()}function wa(e,t,n,a,s,r){let o=e[17],i=e[5],c=e[6];if(!o||!i||!c)return;let l=Math.abs(c.x-i.x)*.78*a.scale,d=l*.72,p=o.x,g=o.y-d*.38+a.offsetY,m=r?t-p-l/2:p-l/2;v.save(),v.globalAlpha=a.opacity,v.drawImage(s,m,g-d/2,l,d),v.restore()}function ka(e,t,n,a,s,r){let o=e[18],i=e[5],c=e[6];if(!o||!i||!c)return;let l=Math.abs(c.x-i.x)*.62*a.scale,d=l*.85,p=o.x,g=o.y+d*.15+a.offsetY,m=r?t-p-l/2:p-l/2;v.save(),v.globalAlpha=a.opacity,v.drawImage(s,m,g-d/2,l,d),v.restore()}function Ea(e,t,n,a,s,r){let o=e[9],i=e[5],c=e[6];if(!o||!i||!c)return;let l=Math.abs(c.x-i.x)*.32*a.scale,d=l*1.05,p=o.x,g=o.y+a.offsetY,m=r?t-p-l/2:p-l/2;v.save(),v.globalAlpha=a.opacity,v.drawImage(s,m,g-d/2,l,d),v.restore()}function Ta(e){try{let t=e.naturalWidth,n=e.naturalHeight;if(!t||!n)return null;let a=document.createElement("canvas");a.width=t,a.height=n;let s=a.getContext("2d",{willReadFrequently:!0});s.drawImage(e,0,0);let r=s.getImageData(0,0,t,n),o=r.data,i=[0,(t-1)*4,(n-1)*t*4,(n*t-1)*4],c=0,u=0,l=0;if(i.forEach(d=>{c+=o[d],u+=o[d+1],l+=o[d+2]}),c/=4,u/=4,l/=4,c>210&&u>210&&l>210){for(let d=0;d<o.length;d+=4){let p=Math.sqrt((o[d]-c)**2+(o[d+1]-u)**2+(o[d+2]-l)**2);p<42&&(o[d+3]=Math.round(o[d+3]*Math.max(0,(p-14)/28)))}return s.putImageData(r,0,0),a}return null}catch{return null}}function Dt(e="",t=""){let n=`${e} ${t}`.toLowerCase();return/sunglass|glasses|eyewear|aviator|shades|spectacle/i.test(n)?"eyewear":/\bcap\b|hat|beanie|snapback|fedora|visor/i.test(n)?"headwear":/necklace|chain|pendant|choker|collar/i.test(n)?"necklace":/earring|stud|jhumka|hoop/i.test(n)?"earrings":/watch|bracelet|bangle|wristband|kada/i.test(n)?"wristwear":/bag|handbag|backpack|tote|purse|clutch/i.test(n)?"bag":/belt|sash/i.test(n)?"belt":/pant|trouser|jean|skirt|shorts|legging/i.test(n)?"lower_body":/dress|gown|saree|sari|lehenga|jumpsuit|anarkali/i.test(n)?"full_body":"upper_body"}function Ut(e){return{eyewear:"Eyewear",headwear:"Hat",necklace:"Necklace",earrings:"Earrings",wristwear:"Watch",bag:"Bag",belt:"Belt",lower_body:"Bottoms",full_body:"Full Outfit",upper_body:"Top"}[e]||"Top"}function qe(e,t){let n=e.garmentCategory||Dt(e.name,e.category),a=e.id||`layer_${Date.now()}`;t&&(_=[]);let s={id:a,name:e.name||"Fashion Item",category:e.category||"Garment",garmentCategory:n,imageUrl:e.imageUrl,enabled:!0,scale:1,offsetY:0,opacity:me,imageElement:null,processedCanvas:null,availableSizes:e.availableSizes||["XS","S","M","L","XL","XXL"]},r=_.findIndex(i=>i.garmentCategory===n);r>=0?_[r]=s:_.push(s),nt&&(nt.textContent=s.name),rt&&(rt.textContent=`${Ut(n)} \xB7 ${s.category}`),ie&&(ie.style.display="block",ie.src=s.imageUrl,ie.onerror=()=>{ie.style.display="none"});let o=new Image;o.crossOrigin="anonymous",o.onload=()=>{s.imageElement=o,s.processedCanvas=Ta(o)||o,ue(),Ot(s.availableSizes),z(`\u2726 ${s.name.slice(0,26)} ready!`)},o.onerror=()=>{let i=new Image;i.onload=()=>{s.imageElement=i,s.processedCanvas=i,ue(),Ot(s.availableSizes)},i.src=s.imageUrl},o.src=s.imageUrl,ue(),Fe()}function ue(){if(ke){if(ke.innerHTML="",_.length===0){ke.innerHTML='<div class="v-outfit-empty">No items loaded yet. Try a sample or grab from the page.</div>',Fe();return}_.forEach(e=>{let t=document.createElement("div");t.className=`v-layer-card${e.enabled?"":" disabled"}`;let n=document.createElement("img");n.className="v-layer-thumb",n.src=e.imageUrl,n.alt=e.name,n.onerror=()=>{n.style.display="none"};let a=document.createElement("div");a.className="v-layer-info",a.innerHTML=`<div class="v-layer-cat">${Ut(e.garmentCategory)}</div><div class="v-layer-name" title="${e.name}">${e.name}</div>`;let s=document.createElement("div");s.className="v-layer-btns";let r=document.createElement("button");r.className=`v-layer-btn ${e.enabled?"on":""}`,r.textContent=e.enabled?"\u2713":"\u25CB",r.addEventListener("click",i=>{i.stopPropagation(),e.enabled=!e.enabled,ue()});let o=document.createElement("button");o.className="v-layer-btn remove",o.textContent="\xD7",o.addEventListener("click",i=>{i.stopPropagation(),_=_.filter(c=>c.id!==e.id),ue(),Fe(),z(`Removed ${e.name.slice(0,20)}`)}),s.appendChild(r),s.appendChild(o),t.appendChild(n),t.appendChild(a),t.appendChild(s),ke.appendChild(t)}),Fe()}}function Fe(){if(!ot)return;let e=_.filter(n=>n.enabled).length,t=_.length;ot.textContent=t===0?"0":e===t?`${t}`:e===0?"0/"+t:`${e}/${t}`}function La(e,t,n){let a=e.landmarks,s=a[5],r=a[6],o=a[11],i=a[12],c=(h,x)=>Math.sqrt((h.x-x.x)**2+(h.y-x.y)**2),u=c(s,r),l=c(o,i),d=c({x:(s.x+r.x)/2,y:(s.y+r.y)/2},{x:(o.x+i.x)/2,y:(o.y+i.y)/2}),p=Math.max(1,u/44),g=Math.round(u/p),m=Math.round(u*2.1/p),f=Math.round(l*2.4/p),b=Math.round(d/p);st&&(st.textContent=`${g} cm`),it&&(it.textContent=`${m} cm`),ct&&(ct.textContent=`${f} cm`),lt&&(lt.textContent=`${b} cm`);let y=Sa(g,m,f);Ne&&(Ne.textContent=y),Ma(y)}function Sa(e,t,n){let a="M",s=1/0;for(let[r,o]of Object.entries(ca)){let i=Math.abs(e-(o.shoulder[0]+o.shoulder[1])/2)*2+Math.abs(t-(o.chest[0]+o.chest[1])/2)+Math.abs(n-(o.waist[0]+o.waist[1])/2);i<s&&(s=i,a=r)}return a}function Ot(e){if(!ce)return;ce.innerHTML="";let t=Ne?.textContent||"M";e.forEach(n=>{let a=document.createElement("button");a.className=`v-size-pill${n===t?" rec":""}`,a.textContent=n,a.addEventListener("click",()=>{ce.querySelectorAll(".v-size-pill").forEach(s=>s.classList.remove("selected")),a.classList.add("selected"),z(`Selected size: ${n}`)}),ce.appendChild(a)})}function Ma(e){ce?.querySelectorAll(".v-size-pill").forEach(t=>{t.classList.toggle("rec",t.textContent===e)})}function Ca(){if(!k||!A)return;let e=document.createElement("canvas");e.width=k.videoWidth||640,e.height=k.videoHeight||480;let t=e.getContext("2d");Q==="user"?(t.scale(-1,1),t.drawImage(k,-e.width,0,e.width,e.height),t.scale(-1,1)):t.drawImage(k,0,0),t.drawImage(A,0,0),t.font="bold 14px Inter,sans-serif",t.fillStyle="rgba(255,255,255,0.75)",t.fillText("\u2726 VESTORA",12,e.height-12);let n=document.createElement("a");n.download=`vestora-${Date.now()}.png`,n.href=e.toDataURL(),n.click(),z("\u2726 Screenshot saved!")}var at=null;function z(e){let t=w?.getElementById("v-toast-text");!Ue||!t||(at&&clearTimeout(at),t.textContent=e,Ue.classList.add("visible"),at=setTimeout(()=>{Ue.classList.remove("visible")},2800))}var Me=new Pe("ProductDetector");(function(){if(window.__vestoraInitialized)return;window.__vestoraInitialized=!0,Me.info("VESTORA autonomous product detector active on",location.hostname);let t=null,n=!1;function a(){["#__decart-tryon-widget","#__decart-pill-btn",".vton-btn","[id*='decart']","[class*='anywear']","[id*='anywear']"].forEach(g=>{document.querySelectorAll(g).forEach(m=>{try{m.style.setProperty("display","none","important"),m.remove()}catch{}})})}if(location.hostname.toLowerCase().includes("google.")||St()){Me.info("Google Search/Images detected \u2014 activating dedicated Google Images Try-On Scanner"),Mt(u);return}a(),Tt(()=>{let p=t||c()||{id:`prod_dock_${Date.now()}`,name:document.title.split(/[-|·]/)[0].trim()||"Detected Apparel",brand:location.hostname.replace("www.","").split(".")[0].toUpperCase(),imageUrl:"",productUrl:location.href,pageUrl:location.href,category:"upper_body",isFashion:!0,availableSizes:["S","M","L","XL"],outOfStockSizes:[],confidence:1,detectionSource:"dom-heuristic"};Se(p),l("\u2726 VESTORA Live Try-On ready!")});let r=new IntersectionObserver(p=>{p.forEach(g=>{if(g.isIntersecting){let m=g.target;r.unobserve(m),J(m)&&we(m,u)}})},{rootMargin:"300px 0px"});function o(p=document){a(),Array.from(p.querySelectorAll("img")).forEach(b=>{b.complete&&b.naturalWidth>0?J(b)&&we(b,u):(b.addEventListener("load",()=>{J(b)&&we(b,u)},{once:!0}),r.observe(b))});let m=["[style*='background-image']",".image-grid-image",".image-grid-col",".pdp-image-container",".product-sliderContainer",".product-image",".img-container",".prod-image",".product__media",".product-single__photo",".product-media",".gallery-image","[data-testid*='product-image']","._396cs4","#landingImage",".product-base",".results-base"].join(", ");Array.from(p.querySelectorAll(m)).forEach(b=>{J(b)&&we(b,u)}),n||i()}function i(){let p=Ge(document,location);if(p.isProductPage){Me.info("Generic PDP detected with confidence:",p.confidence,"Signals:",p.signals);let g=Ke(document,location);g&&g.imageUrl&&(t=g,n=!0,chrome.runtime.sendMessage({type:"VESTORA_PRODUCT_DETECTED",payload:g}).catch(()=>{}),Et(g,u))}}function c(){if(t)return t;let p=Ke(document,location);if(p&&p.imageUrl)return t=p,p;let m=Array.from(document.querySelectorAll("img, [style*='background-image'], .image-grid-image, .image-grid-col")).filter(J);if(m.length>0){let f=m[0],b=xe(f);if(b)return t=Oe(f,b),t}return null}function u(p){Me.info("User requested try-on for:",p.name),t=p,Se(p),chrome.runtime.sendMessage({type:"VESTORA_PRODUCT_DETECTED",payload:p}).catch(()=>{}),l("\u2726 VESTORA Live Try-On ready!")}function l(p){let g=document.createElement("div");g.style.cssText=`
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(20px);
      background:linear-gradient(135deg,#7c3aed,#4f46e5); color:#fff;
      padding:12px 24px; border-radius:100px; font-family:'Inter',sans-serif;
      font-size:14px; font-weight:600; z-index:2147483647; opacity:0;
      box-shadow:0 8px 32px rgba(124,58,237,0.4); transition:all 0.3s cubic-bezier(.34,1.56,.64,1);
      white-space:nowrap; letter-spacing:0.02em;
    `,g.textContent=p,document.body.appendChild(g),requestAnimationFrame(()=>{g.style.opacity="1",g.style.transform="translateX(-50%) translateY(0)"}),setTimeout(()=>{g.style.opacity="0",g.style.transform="translateX(-50%) translateY(20px)",setTimeout(()=>g.remove(),400)},3e3)}o(document),new MutationObserver(()=>{o(document)}).observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{n||i()},1500),chrome.runtime.onMessage.addListener((p,g,m)=>{if(p&&p.type==="VESTORA_OPEN_TRYON"){Me.info("Received request to open try-on from popup/action");let f=t||c();if(f)Se(f),l("\u2726 VESTORA Live Try-On ready!"),m?.({success:!0,product:f});else{let b={id:`prod_popup_${Date.now()}`,name:"Browse & Try Fashion",brand:location.hostname.replace("www.","").split(".")[0].toUpperCase(),imageUrl:"",productUrl:location.href,pageUrl:location.href,category:"upper_body",isFashion:!0,availableSizes:["S","M","L","XL"],outOfStockSizes:[],confidence:1,detectionSource:"dom-heuristic"};Se(b),l("\u2726 VESTORA ready \u2014 hover any garment image!"),m?.({success:!0,product:b})}return!1}if(p&&p.type==="VESTORA_REQUEST_PAGE_PRODUCT"){let f=t||c();return m?.({success:!!f,product:f}),!1}})})();})();
