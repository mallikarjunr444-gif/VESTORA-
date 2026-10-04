"use strict";(()=>{var He=class{namespace;constructor(t){this.namespace=t}format(t,n){let a=new Date().toISOString().split("T")[1].replace("Z","");return`[VESTORA:${this.namespace}] ${a} [${t.toUpperCase()}] ${n}`}debug(t,...n){typeof process<"u"}info(t,...n){console.info(this.format("info",t),...n)}warn(t,...n){console.warn(this.format("warn",t),...n)}error(t,...n){console.error(this.format("error",t),...n)}};var Kt=[/\/(?:products?|items?|goods|catalog|dp|gp\/product|p)\/([^/?#]+)/i,/[?&](?:sku|product[-_]?id|item[-_]?id|pid|variant)=/i,/\/(?:buy|shop)\/([^/?#]+)/i,/\b[A-Za-z0-9_-]{5,16}(?:pdp|prd)\b/i],Zt=[/\/(?:cart|checkout|basket|bag)\b/i,/\/(?:account|login|signin|register|signup|profile|my-account)\b/i,/\/(?:terms|privacy|contact|help|faq|about|policy|support|shipping)\b/i,/\/(?:search|categories|collections|c)\/?$/i,/\/(?:blog|article|stories|news)\//i],Qt=[/add\s*(?:to)?\s*(?:cart|bag|basket)/i,/buy\s*(?:it)?\s*now/i,/order\s*now/i,/bag\s*it/i,/quick\s*buy/i,/purchase/i,/add\s*to\s*tote/i],ea=["\u20B9","$","\u20AC","\xA3","\xA5","Rs.","INR","USD","EUR","GBP","AED","AUD","CAD"];function Ge(e=document,t=location){let n=[],a=0,i=t.pathname||"";for(let g of Zt)if(g.test(i))return{isProductPage:!1,confidence:0,signals:[`negative_url:${g}`]};for(let g of Kt)if(g.test(t.href)){a+=.35,n.push("pdp_url_pattern");break}let o=null;try{let g=e.querySelectorAll('script[type="application/ld+json"]');for(let f of Array.from(g)){let b=f.textContent?.trim()||"";if(!b)continue;let x=JSON.parse(b),v=Array.isArray(x)?x:x["@graph"]?x["@graph"]:[x];for(let k of v)if(k&&(k["@type"]==="Product"||k["@type"]==="IndividualProduct")){o=k,a+=.5,n.push("json_ld_product");break}if(o)break}}catch{}o||e.querySelector('[itemscope][itemtype*="schema.org/Product"]')&&(a+=.4,n.push("microdata_product"));let r=e.querySelector('meta[property="og:type"]')?.getAttribute("content");r&&/product/i.test(r)&&(a+=.35,n.push("opengraph_product_type")),e.querySelector('meta[property="product:price:amount"], meta[property="og:price:amount"]')&&(a+=.25,n.push("opengraph_price"));let s=Array.from(e.querySelectorAll("button, input[type='submit'], input[type='button'], a[role='button'], .btn, .button")),c=!1;for(let g of s){let f=(g.textContent||g.getAttribute("aria-label")||g.getAttribute("value")||"").trim();if(f&&Qt.some(b=>b.test(f))){c=!0,a+=.3,n.push(`add_to_cart_btn:${f.slice(0,20)}`);break}}let p=["[class*='price']","[id*='price']","[data-price]",".pdp-price",".product-price",".price-box"],l=!1;for(let g of p){let f=e.querySelector(g);if(f){let b=f.textContent||"";if(ea.some(x=>b.includes(x))||/\d+[.,]\d{2}/.test(b)){l=!0,a+=.2,n.push("dom_price_indicator");break}}}e.querySelector("[class*='size-selector'], [class*='size-buttons'], select[name*='size'], [data-testid*='size'], .size-swatches, [role='radiogroup'][aria-label*='size' i]")&&(a+=.2,n.push("dom_size_selector"));let u=Math.min(1,a);return{isProductPage:u>=.45,confidence:u,signals:n,rawJsonLd:o||void 0}}var ta=[/\b(?:smartphone|iphone|samsung\s*galaxy|android|laptop|macbook|computer|charger|usb|cable|keyboard|mouse|headphone|earbud|speaker|monitor|television|smartwatch)\b/i,/\b(?:sofa|couch|dining\s*table|bedsheet|pillow|mattress|curtain|blanket|kitchenware|cooker|pan|knife|cutlery|refrigerator|microwave)\b/i,/\b(?:shampoo|conditioner|face\s*wash|lotion|serum|lipstick|eyeliner|perfume|cologne|toothpaste|skincare|sunscreen)\b/i,/\b(?:grocery|snack|chocolate|coffee|tea|supplement|protein|vitamin|pet\s*food)\b/i,/\b(?:book|novel|ebook|magazine|comic|stationery|pen|pencil|notebook)\b/i,/\b(?:drill|hammer|wrench|screw|hardware|car\s*part|tire|motor\s*oil)\b/i,/\b(?:toy|lego|board\s*game|doll|action\s*figure|puzzle)\b/i],aa=[{category:"full_body",type:"Saree",pattern:/\b(?:saree|sari|kanjivaram|banarasi|chanderi)\b/i},{category:"full_body",type:"Lehenga",pattern:/\b(?:lehenga|ghagra|chaniya\s*choli)\b/i},{category:"full_body",type:"Anarkali Suit",pattern:/\b(?:anarkali|angrakha)\b/i},{category:"full_body",type:"Salwar Suit",pattern:/\b(?:salwar\s*(?:suit|kameez)|churidar\s*suit|patiala\s*suit)\b/i},{category:"full_body",type:"Sherwani",pattern:/\b(?:sherwani|achkan|indo[- ]?western\s*suit)\b/i},{category:"full_body",type:"Ethnic Set",pattern:/\b(?:ethnic\s*set|kurta\s*set|kurta\s*pajama)\b/i},{category:"full_body",type:"Co-ord Set",pattern:/\b(?:co[- ]?ord|coord\s*set|two[- ]?piece\s*set)\b/i},{category:"full_body",type:"Dress",pattern:/\b(?:dress|gown|maxi\s*dress|midi\s*dress|mini\s*dress|sundress|frock|slip\s*dress)\b/i},{category:"full_body",type:"Jumpsuit",pattern:/\b(?:jumpsuit|romper|dungaree|playsuit)\b/i},{category:"full_body",type:"Tracksuit",pattern:/\b(?:tracksuit|sweatsuit)\b/i},{category:"full_body",type:"Kaftan",pattern:/\b(?:kaftan|caftan)\b/i},{category:"upper_body",type:"Kurta",pattern:/\b(?:kurta|kurti|tunic)\b/i},{category:"upper_body",type:"Nehru Jacket",pattern:/\b(?:nehru\s*jacket|bundi|bandhgala(?:[- ]?jacket)?|jodhpuri(?:[- ]?suit)?|waistcoat)\b/i},{category:"upper_body",type:"T-Shirt",pattern:/\b(?:t[-\s]?shirt|tee|graphic\s*tee|crewneck|v[- ]?neck)\b/i},{category:"upper_body",type:"Polo",pattern:/\b(?:polo\s*shirt|polo\s*tee|polo)\b/i},{category:"upper_body",type:"Shirt",pattern:/\b(?:casual\s*shirt|formal\s*shirt|linen\s*shirt|overshirt|button[- ]?down|flannel)\b/i},{category:"upper_body",type:"Hoodie",pattern:/\b(?:hoodie|hooded\s*sweatshirt|pullover\s*hoodie)\b/i},{category:"upper_body",type:"Sweatshirt",pattern:/\b(?:sweatshirt|fleece\s*crew)\b/i},{category:"upper_body",type:"Jacket",pattern:/\b(?:denim\s*jacket|bomber\s*jacket|puffer|windbreaker|biker\s*jacket|varsity|leather\s*jacket)\b/i},{category:"upper_body",type:"Blazer",pattern:/\b(?:blazer|suit\s*jacket|sport\s*coat)\b/i},{category:"upper_body",type:"Coat",pattern:/\b(?:overcoat|trench\s*coat|parka|peacoat)\b/i},{category:"upper_body",type:"Top",pattern:/\b(?:crop\s*top|tank\s*top|camisole|halter\s*top|blouse|corset|tube\s*top)\b/i},{category:"upper_body",type:"Sweater",pattern:/\b(?:sweater|cardigan|pullover|knitwear|jumper)\b/i},{category:"upper_body",type:"Vest",pattern:/\b(?:gilet|vest|puffer\s*vest)\b/i},{category:"lower_body",type:"Jeans",pattern:/\b(?:jeans|denim\s*pants|skinny\s*jeans|baggy\s*jeans|flare\s*jeans|straight\s*fit\s*jeans)\b/i},{category:"lower_body",type:"Trousers",pattern:/\b(?:trousers|chinos|formal\s*pants|khakis|slacks)\b/i},{category:"lower_body",type:"Shorts",pattern:/\b(?:shorts|bermuda|cargo\s*shorts|denim\s*shorts|boardshorts)\b/i},{category:"lower_body",type:"Skirt",pattern:/\b(?:skirt|mini\s*skirt|midi\s*skirt|pleated\s*skirt|pencil\s*skirt)\b/i},{category:"lower_body",type:"Joggers",pattern:/\b(?:joggers|sweatpants|track\s*pants|lounge\s*pants)\b/i},{category:"lower_body",type:"Leggings",pattern:/\b(?:leggings|tights|yoga\s*pants)\b/i},{category:"lower_body",type:"Ethnic Bottoms",pattern:/\b(?:palazzo|dhoti|salwar|churidar|sharara|gharara)\b/i},{category:"lower_body",type:"Cargos",pattern:/\b(?:cargo\s*pants|cargos|combat\s*pants)\b/i},{category:"shoes",type:"Sneakers",pattern:/\b(?:sneakers|trainers|running\s*shoes|kicks|tennis\s*shoes)\b/i},{category:"shoes",type:"Boots",pattern:/\b(?:boots|chelsea\s*boots|ankle\s*boots|combat\s*boots)\b/i},{category:"shoes",type:"Loafers",pattern:/\b(?:loafers|moccasins|boat\s*shoes)\b/i},{category:"shoes",type:"Heels",pattern:/\b(?:heels|stilettos|pumps|wedges)\b/i},{category:"shoes",type:"Sandals",pattern:/\b(?:sandals|slides|flip[- ]?flops|slippers|clogs|crocs)\b/i},{category:"shoes",type:"Ethnic Footwear",pattern:/\b(?:juttis|mojaris|kolhapuris)\b/i},{category:"eyewear",type:"Sunglasses",pattern:/\b(?:sunglasses|shades|eyewear|spectacles|glasses|aviators?|wayfarers?)\b/i},{category:"headwear",type:"Hat",pattern:/\b(?:cap|baseball\s*cap|hat|beanie|bucket\s*hat|fedora|beret|snapback)\b/i},{category:"earrings",type:"Earrings",pattern:/\b(?:earrings?|ear\s*studs?|hoops?|jhumkas?|drop\s*earrings?)\b/i},{category:"necklace",type:"Necklace",pattern:/\b(?:necklace|choker|chain|pendant|locket|collar\s*necklace)\b/i},{category:"wristwear",type:"Watch",pattern:/\b(?:watch|wrist\s*watch|chronograph|bracelet|bangle|wristband)\b/i},{category:"ring",type:"Ring",pattern:/\b(?:ring|finger\s*ring|band|signet\s*ring)\b/i},{category:"bag",type:"Bag",pattern:/\b(?:handbag|backpack|tote\s*bag|clutch|sling\s*bag|duffel|crossbody|satchel|shoulder\s*bag)\b/i},{category:"belt",type:"Belt",pattern:/\b(?:leather\s*belt|waist\s*belt|designer\s*belt|buckle\s*belt)\b/i},{category:"scarf",type:"Scarf",pattern:/\b(?:dupatta|stole|scarf|shawl|muffler)\b/i}];function ye(e,t="",n="",a=[]){let i=`${e} ${t} ${n} ${a.join(" ")}`.toLowerCase();for(let r of ta)if(r.test(i)&&!/\b(?:t-shirt|shirt|hoodie|jeans|dress|saree|kurta|jacket|blazer|top|pants|sneakers)\b/i.test(i))return{isFashion:!1,category:"other",garmentType:"Non-Apparel",confidence:.95};for(let r of aa)if(r.pattern.test(i))return{isFashion:!0,category:r.category,garmentType:r.type,confidence:.94};return/\b(?:apparel|clothing|wear|outfit|garment|fashion|attire)\b/i.test(i)?{isFashion:!0,category:"upper_body",garmentType:"Apparel",confidence:.7}:{isFashion:!1,category:"unknown",garmentType:"Item",confidence:.4}}var ht=[/\b(?:logo|brand[-_]?logo|site[-_]?logo)\b/i,/\b(?:banner|promo|hero[-_]?banner|slide[-_]?banner)\b/i,/\b(?:icon|favicon|cart[-_]?icon|search[-_]?icon|close[-_]?icon|arrow)\b/i,/\b(?:avatar|user[-_]?profile|author|testimonial)\b/i,/\b(?:payment|visa|mastercard|amex|rupay|upi|paypal|paytm)\b/i,/\b(?:badge|seal|guarantee|trustpilot|certified|ssl)\b/i,/\b(?:rating|star|review[-_]?star)\b/i,/\b(?:social|facebook|instagram|twitter|youtube|linkedin|tiktok)\b/i,/\b(?:sprite|pixel|spacer|blank\.gif|loading|placeholder)\b/i];function xe(e){if(e.tagName==="IMG"){let i=e,o=i.getAttribute("data-a-dynamic-image");if(o)try{let l=JSON.parse(o),d=Object.keys(l);if(d.length>0)return d.sort((u,m)=>(l[m][0]||0)-(l[u][0]||0)),j(d[0])}catch{}let r=["data-zoom-image","data-old-hires","data-large-image","data-high-res-src","data-full-src","data-magnify-src","data-zoom","data-origin","data-original","data-src","data-lazy-src"];for(let l of r){let d=i.getAttribute(l);if(d&&/^https?:\/\//i.test(d))return j(d)}let s=i.closest("picture");if(s){let l=Array.from(s.querySelectorAll("source[srcset]"));for(let d of l){let u=d.getAttribute("srcset");if(u){let m=vt(u);if(m)return j(m)}}}let c=i.getAttribute("srcset");if(c){let l=vt(c);if(l)return j(l)}let p=i.currentSrc||i.src||"";return j(p)}let t=e.style.backgroundImage||window.getComputedStyle(e).backgroundImage;if(t&&t.startsWith("url(")){let i=t.match(/url\(['"]?(.*?)['"]?\)/i);if(i&&i[1])return j(i[1])}let n=e.querySelector("[style*='background-image'], .image-grid-image");if(n){let i=n.style?.backgroundImage||window.getComputedStyle(n).backgroundImage;if(i&&i.startsWith("url(")){let o=i.match(/url\(['"]?(.*?)['"]?\)/i);if(o&&o[1])return j(o[1])}}let a=e.querySelector("img");return a?xe(a):""}function vt(e){let t=e.split(",").map(i=>i.trim());if(t.length===0)return null;let n=null,a=0;for(let i of t){let o=i.split(/\s+/),r=o[0],s=o[1]||"",c=1;s.endsWith("w")?c=parseInt(s.replace("w",""),10)||1:s.endsWith("x")&&(c=(parseFloat(s.replace("x",""))||1)*1e3),c>=a&&/^https?:\/\//i.test(r)&&(a=c,n=r)}return n||t[t.length-1]?.split(/\s+/)[0]||null}function j(e){return e?(e.includes("/image/upload/")&&(e=e.replace(/\/image\/upload\/(?:[a-zA-Z0-9_,]+)\//,"/image/upload/q_auto:best,f_auto,w_1440/")),e.includes("cdn.shopify.com")&&(e=e.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|\d+x\d+)\.(jpg|jpeg|png|webp)/i,"_master.$1"),e=e.replace(/[?&]width=\d+/,"?width=1440")),/[?&](?:w|width)=\d+/i.test(e)&&(e=e.replace(/([?&](?:w|width)=)\d+/i,"$11440")),/[?&]quality=\d+/i.test(e)&&(e=e.replace(/([?&]quality=)\d+/i,"$195")),/[?&]wid=\d+/i.test(e)&&(e=e.replace(/([?&]wid=)\d+/i,"$11600")),e.includes("assets.myntassets.com")?e=e.replace(/\/f_webp,[^/]+\//,"/h_1440,q_95,w_1080/").replace(/\/h_\d+,q_\d+,w_\d+\//,"/h_1440,q_95,w_1080/").replace(/\/w_\d+,c_limit,fl_progressive\//,"/h_1440,q_95,w_1080/"):e.includes("flixcart.com/image/")?e=e.replace(/\/image\/\d+\/\d+\//,"/image/832/832/"):e.includes("media-amazon.com")||e.includes("images-amazon.com")?e=e.replace(/\._[A-Z0-9_,]+_\./,"._AC_SL1500_."):e.includes("static.zara.net")||e.includes("itxweb.com")?e=e.replace(/\/w\/\d+\//,"/w/1024/"):e.includes("ltwebstatic.com")?e=e.replace(/_thumbnail_\d+x\d+/,"").replace(/_\d+x\d+\.jpg/,".jpg"):e.includes("asos-media.com")?e=e.replace(/\?\$[^$]+\$/,"?$n_960w$"):e.includes("images.meesho.com")&&(e=e.replace(/\/(?:256|512)\//,"/1024/")),e):""}function J(e){let t=e.getBoundingClientRect(),n=t.width||e.offsetWidth||e.naturalWidth||e.width||0,a=t.height||e.offsetHeight||e.parentElement?.offsetHeight||0||e.naturalHeight||e.height||0;if(n<180||a<180)return!1;let i=a/n;if(i<.65||i>2.8)return!1;let o=xe(e);if(!o||o.startsWith("data:image/svg")||o.endsWith(".svg"))return!1;for(let d of ht)if(d.test(o))return!1;let r=e.getAttribute("alt")||"",s=e.getAttribute("title")||"",c=String(e.className||""),p=e.id||"",l=`${r} ${s} ${c} ${p}`.toLowerCase();for(let d of ht)if(d.test(l))return!1;return!e.closest("header, footer, nav, [role='banner'], [role='navigation']")}var yt=["XXS","XS","S","M","L","XL","XXL","2XL","3XL","4XL"],xt=["28","30","32","34","36","38","39","40","42","44","46","48"];function Je(e=document){let t=new Set,n=new Set,a=Array.from(e.querySelectorAll("button, [role='radio'], [data-size], [data-attr-value], .size-buttons-size-button, .size-pill, .size-option, [class*='size-item'], [class*='size-btn'], [class*='SizeButton']"));for(let s of a){let c=(s.textContent||s.getAttribute("data-size")||s.getAttribute("data-attr-value")||"").trim().toUpperCase();if(!c)continue;let p=null,l=c.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL)\b/);if(l&&(p=l[1]),!p){let d=c.match(/\b(28|30|32|34|36|38|39|40|42|44|46|48)\b/);d&&(p=d[1])}p&&(s.hasAttribute("disabled")||s.getAttribute("aria-disabled")==="true"||/\b(?:disabled|out[-_]?of[-_]?stock|sold[-_]?out|unavailable|strikethrough)\b/i.test(s.className)?n.add(p):t.add(p))}if(t.size===0){let s=e.querySelector("select[name*='size' i], select[id*='size' i]");if(s)for(let c of Array.from(s.options)){let p=c.text.trim().toUpperCase();for(let l of[...yt,...xt])p.includes(l)&&(c.disabled||p.includes("OUT OF STOCK")||p.includes("SOLD OUT")?n.add(l):t.add(l))}}if(t.size===0)return{available:["XS","S","M","L","XL","XXL"],outOfStock:[],source:"default"};let i=[...yt,...xt],o=i.filter(s=>t.has(s)),r=i.filter(s=>n.has(s));return{available:o,outOfStock:r,source:"dom-pills"}}function Ke(e=document,t=location){let n=Ge(e,t),a="",i="",o="",r="",s="";if(n.rawJsonLd){let l=n.rawJsonLd;if(a=String(l.name||""),l.brand&&(i=typeof l.brand=="string"?l.brand:String(l.brand.name||"")),l.image){let d=Array.isArray(l.image)?l.image[0]:l.image;s=typeof d=="string"?d:String(d?.url||"")}if(l.offers){let d=Array.isArray(l.offers)?l.offers[0]:l.offers;d&&(o=String(d.price||d.lowPrice||""),r=String(d.priceCurrency||""))}}if(!a){let l=e.querySelector('meta[property="og:title"]')?.getAttribute("content")||e.querySelector("h1")?.textContent?.trim()||e.title.split(/[-|·]/)[0].trim();/^(?:shop\s+for|buy\s+online|online\s+shopping|men'?s\s+clothing|women'?s\s+clothing|all\s+products|browse|sale\b|new\s+arrivals)/i.test(l)||(a=l)}i||(i=e.querySelector('meta[property="og:site_name"]')?.getAttribute("content")||t.hostname.replace("www.","").split(".")[0].toUpperCase());let c=ye(a,"",t.pathname);if(!s){let l=e.querySelector('meta[property="og:image"]')?.getAttribute("content");l&&!l.includes("logo")&&!l.includes("favicon")&&(s=j(l))}if(!s){let d=Array.from(e.querySelectorAll("img, [style*='background-image']")).filter(J);d.length>0&&(s=xe(d[0]))}if(!s)return null;let p=Je(e);return{id:`prod_${Date.now()}`,name:a,brand:i,price:o?`${r} ${o}`.trim():void 0,currency:r||void 0,imageUrl:s,productUrl:t.href,pageUrl:t.href,category:c.garmentType,isFashion:c.isFashion,availableSizes:p.available,outOfStockSizes:p.outOfStock,confidence:n.confidence,detectionSource:n.rawJsonLd?"json-ld":"dom-heuristic"}}function Pe(e){if(e.tagName==="IMG"){let i=e,o=i.getAttribute("data-a-dynamic-image");if(o)try{let l=JSON.parse(o),d=Object.keys(l);if(d.length>0)return d.sort((u,m)=>(l[m][0]||0)-(l[u][0]||0)),d[0]}catch{}let r=i.getAttribute("data-old-hires")||i.getAttribute("data-zoom-image")||i.getAttribute("data-large-image")||i.getAttribute("data-high-res-src")||i.getAttribute("data-full-src");if(r&&/^https?:\/\//i.test(r))return r;let s=i.closest("picture");if(s){let l=Array.from(s.querySelectorAll("source[srcset]"));for(let d of l){let u=d.getAttribute("srcset");if(u){let m=u.split(",").map(f=>f.trim().split(" ")[0]),g=m[m.length-1];if(g&&/^https?:\/\//i.test(g))return g}}}let c=i.getAttribute("srcset");if(c){let l=c.split(",").map(u=>u.trim().split(" ")[0]),d=l[l.length-1];if(d&&/^https?:\/\//i.test(d))return d}let p=i.getAttribute("data-src")||i.getAttribute("data-original")||i.getAttribute("data-lazy-src")||i.currentSrc||i.src||"";return Ze(p)}let t=e.style.backgroundImage||window.getComputedStyle(e).backgroundImage;if(t&&t.startsWith("url(")){let i=t.match(/url\(['"]?(.*?)['"]?\)/i);if(i&&i[1])return Ze(i[1])}let n=e.querySelector("[style*='background-image'], .image-grid-image");if(n){let i=n.style?.backgroundImage||window.getComputedStyle(n).backgroundImage;if(i&&i.startsWith("url(")){let o=i.match(/url\(['"]?(.*?)['"]?\)/i);if(o&&o[1])return Ze(o[1])}}let a=e.querySelector("img");return a?Pe(a):""}function Ze(e){return e?e.includes("assets.myntassets.com")?e.replace(/\/f_webp,[^/]+\//,"/h_1440,q_95,w_1080/").replace(/\/h_\d+,q_\d+,w_\d+\//,"/h_1440,q_95,w_1080/").replace(/\/w_\d+,c_limit,fl_progressive\//,"/h_1440,q_95,w_1080/"):e.includes("flixcart.com/image/")?e.replace(/\/image\/\d+\/\d+\//,"/image/832/832/"):e.includes("media-amazon.com")||e.includes("images-amazon.com")?e.replace(/\._[A-Z0-9_,]+_\./,"._AC_SL1500_."):e.includes("static.zara.net")||e.includes("itxweb.com")?e.replace(/\/w\/\d+\//,"/w/1024/"):e.includes("ltwebstatic.com")?e.replace(/_thumbnail_\d+x\d+/,"").replace(/_\d+x\d+\.jpg/,".jpg"):e.includes("asos-media.com")?e.replace(/\?\$[^$]+\$/,"?$n_960w$"):e.includes("cdn.shopify.com")?e.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|\d+x\d+)\.(jpg|jpeg|png|webp)/i,"_master.$1"):e.includes("images.meesho.com")?e.replace(/\/(?:256|512)\//,"/1024/"):e.includes("assets.ajio.com")?e.replace(/\?.*$/,""):e.includes("nike.com")||e.includes("adidas.com")?e.replace(/[?&]wid=\d+/,"?wid=1400"):e:""}function Oe(e,t){let n="",a="",i="",o="";try{let c=document.querySelectorAll('script[type="application/ld+json"]');for(let p of Array.from(c)){let l=JSON.parse(p.textContent||"{}"),d=l["@type"]==="Product"?l:Array.isArray(l["@graph"])?l["@graph"].find(u=>u["@type"]==="Product"):null;if(d&&d.name){if(n=String(d.name),d.brand&&(a=typeof d.brand=="string"?d.brand:String(d.brand.name||"")),d.offers){let u=Array.isArray(d.offers)?d.offers[0]:d.offers;u&&(i=String(u.price||u.lowPrice||""),o=String(u.priceCurrency||""))}break}}}catch{}if(!n){let c=document.querySelector('meta[property="og:title"]')?.getAttribute("content"),l=(e.closest(".product-base, .item, [data-testid*='product'], article, .pdp-details, .product-card, .product-detail, [class*='ProductCard'], .product-item")||e.parentElement)?.querySelector("h1, h2, h3, .product-title, .product-name, [class*='title'], [class*='Title']"),d=e.getAttribute("alt")||"";n=l?.textContent?.trim()||c||d||document.title.split(/[-|·]/)[0].trim()}a||(a=document.querySelector('meta[property="og:site_name"]')?.getAttribute("content")||location.hostname.replace("www.","").split(".")[0].toUpperCase());let r=ye(n,"",location.pathname),s=Je(document);return{id:`prod_${Date.now()}`,name:n,brand:a,price:i?`${o} ${i}`.trim():void 0,currency:o||void 0,imageUrl:t,productUrl:location.href,pageUrl:location.href,category:r.garmentType,isFashion:r.isFashion,availableSizes:s.available,outOfStockSizes:s.outOfStock,confidence:r.confidence,detectionSource:"dom-heuristic"}}var wt=new WeakSet;function we(e,t){if(wt.has(e))return;wt.add(e);let n=e.parentElement;if(!n)return;window.getComputedStyle(n).position==="static"&&(n.style.position="relative"),e.draggable=!0,n.draggable=!0;try{e.style.webkitUserDrag="element",n.style.webkitUserDrag="element"}catch{}let i=r=>{if(r.dataTransfer){let s=Pe(e);s&&(r.dataTransfer.setData("text/uri-list",s),r.dataTransfer.setData("text/plain",s))}};if(e.addEventListener("dragstart",i),n.addEventListener("dragstart",i),n.querySelector(".vestora-tryon-btn"))return;let o=document.createElement("button");o.type="button",o.className="vestora-tryon-btn",o.setAttribute("aria-label","Try with VESTORA"),o.innerHTML='<span class="vestora-btn-sparkle">\u2726</span> Try with VESTORA',o.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),r.stopImmediatePropagation();let s=Pe(e),c=Oe(e,s);o.classList.add("is-active"),setTimeout(()=>o.classList.remove("is-active"),1200),t(c)}),o.addEventListener("touchstart",r=>{r.stopPropagation()},{passive:!0}),n.appendChild(o)}var Qe=null;function Et(e,t){if(Qe||document.getElementById("vestora-corner-badge")||!e||!e.imageUrl||!e.isFashion)return;let n=document.createElement("div");n.id="vestora-corner-badge",n.className="vestora-corner-badge",n.setAttribute("role","button"),n.setAttribute("aria-label","VESTORA Virtual Try-On Detected Item");let a=e.brand||"Fashion Store",i=e.name||"Clothing Item",o=e.category||"Apparel";n.innerHTML=`
    <img src="${e.imageUrl}" alt="${i}" class="vestora-badge-thumb" />
    <div class="vestora-badge-info">
      <div class="vestora-badge-title-row">
        <span class="vestora-badge-tag">${o}</span>
      </div>
      <span class="vestora-badge-name" title="${i}">${i}</span>
    </div>
    <button class="vestora-badge-cta" type="button">
      <span>\u2726 Try On</span>
    </button>
    <button class="vestora-badge-close" type="button" aria-label="Dismiss">\u2715</button>
  `,n.addEventListener("click",r=>{if(r.target.closest(".vestora-badge-close")){r.stopPropagation(),n.remove(),Qe=null;return}t(e)}),document.body.appendChild(n),Qe=n}var kt=null;function Lt(e){if(kt||document.getElementById("vestora-floating-dock"))return;let t=document.createElement("div");t.id="vestora-floating-dock",t.className="vestora-floating-dock",t.setAttribute("role","button"),t.setAttribute("aria-label","Open VESTORA Live Virtual Try-On"),t.title="VESTORA \u2014 Live AI Virtual Try-On",t.innerHTML=`
    <div class="vestora-dock-handle">
      <span class="vestora-dock-sparkle">\u2726</span>
      <span class="vestora-dock-text">VESTORA</span>
      <span class="vestora-dock-sub">Try-On</span>
    </div>
  `,t.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),e()}),document.body.appendChild(t),kt=t}var Tt=new WeakSet;function St(e=location){let t=e.hostname.toLowerCase(),n=e.pathname.toLowerCase(),a=e.search.toLowerCase();return t.includes("google.")?!!(t.startsWith("images.google.")||a.includes("tbm=isch")||a.includes("udm=2")||n.startsWith("/imghp")||n.startsWith("/images")||(n==="/search"||n==="/"||n==="/webhp")&&typeof document<"u"&&!!document.querySelector("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], #islrg, #islsp, div[jsname='r5xlne'], div.isv-r, img.YQ4gaf, img.rg_i")):!1}function ze(e){let t=e.tagName==="A"?e:e.closest("a[href*='imgurl='], a[href*='/imgres']");if(t&&t.href){try{let o=new URL(t.href,location.origin).searchParams.get("imgurl");if(o&&/^https?:\/\//i.test(o))return o}catch{}let a=t.href.match(/[?&]imgurl=([^&]+)/i);if(a&&a[1])try{let i=decodeURIComponent(a[1]);if(/^https?:\/\//i.test(i))return i}catch{}}let n=e.tagName==="IMG"?e:e.querySelector("img");if(n){let a=n.getAttribute("data-src")||n.getAttribute("data-deferred")||n.currentSrc||n.src||"";if(a.startsWith("data:")||a.length<50){let i=n.closest("#islsp, div[jsname='figiqf'], div.v6bBac, div[data-ri]");if(i){let o=i.querySelector("img[src^='http']:not([src*='google.com/favicon'])");if(o&&o.src&&!o.src.includes("encrypted-tbn"))return o.src}}if(a&&/^https?:\/\//i.test(a))return a}return""}function na(e,t){let n=e.closest("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], div.isv-r, div[jsname='dTDiAc'], #islsp, div[jsname='figiqf']")||e.parentElement,a="",i=n?.querySelector("h3, a[title], [data-lpage] h2, [data-lpage] h3, div.zbN8od, div.mNsIgd");if(i&&(a=i.textContent?.trim()||i.getAttribute("title")||""),!a&&e.tagName==="IMG"&&(a=e.getAttribute("alt")||""),!a&&n){let c=n.querySelector("img");c&&(a=c.getAttribute("alt")||"")}if(!a||a.length<3){let p=new URLSearchParams(location.search).get("q")||"";p?a=p.replace(/[+]/g," ").trim():a="Fashion Item"}let o="Web",r=n?.querySelector("div.NJbYFc, span.yNF4af, span.fA3vx, div.mNsIgd");r&&r.textContent&&(o=r.textContent.trim());let s=ye(a,"",location.search);return{id:`gimg_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,name:a,brand:o,imageUrl:t,productUrl:location.href,pageUrl:location.href,category:s.garmentType,garmentCategory:s.category,isFashion:!0,availableSizes:["XS","S","M","L","XL","XXL"],confidence:s.confidence||.92,detectionSource:"dom-heuristic"}}function et(e,t,n,a){if(Tt.has(e)||e.querySelector(".vestora-tryon-btn, .vestora-google-tryon-pill"))return;Tt.add(e),window.getComputedStyle(e).position==="static"&&(e.style.position="relative");let o=document.createElement("button");o.type="button",o.className="vestora-tryon-btn vestora-google-tryon-pill",o.setAttribute("aria-label","Try with VESTORA"),o.innerHTML='<span class="vestora-btn-sparkle">\u2726</span> Try with VESTORA',o.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),r.stopImmediatePropagation();let c=na(a||e,t);o.classList.add("is-active"),setTimeout(()=>o.classList.remove("is-active"),1200),n(c)}),o.addEventListener("touchstart",r=>{r.stopPropagation()},{passive:!0}),e.appendChild(o)}function Mt(e){function t(){Array.from(document.querySelectorAll("#islsp img.n3VNCb, #islsp img.sFlh5c, #islsp img.pT0Scc, div.v6bBac img, img[jsname='HiaYvf'], div[jsname='figiqf'] img")).forEach(r=>{let s=ze(r)||r.currentSrc||r.src;if(s&&!s.startsWith("data:image/svg")&&s.length>20){let c=r.closest("#islsp, div[jsname='figiqf'], div.v6bBac")||r.parentElement;c&&et(c,s,e,r)}}),Array.from(document.querySelectorAll("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], div.isv-r, div.eA0Zlc, div.foyFie, div.mNsIgd")).forEach(r=>{let s=r.querySelector("img")||(r.tagName==="IMG"?r:null);if(!s)return;let c=ze(r)||ze(s)||s.currentSrc||s.src;c&&!c.startsWith("data:image/svg")&&c.length>20&&et(r,c,e,s)}),Array.from(document.querySelectorAll("img.YQ4gaf, img.rg_i, img.Q4LuSd")).forEach(r=>{let s=r.closest("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], div.isv-r")||r.parentElement;if(!s)return;let c=ze(r)||r.currentSrc||r.src;c&&!c.startsWith("data:image/svg")&&c.length>20&&et(s,c,e,r)})}t(),new MutationObserver(()=>{t()}).observe(document.body,{childList:!0,subtree:!0}),setInterval(t,1200)}var Re=class{analysisCanvas=null;analysisCtx=null;prevLandmarks=null;prevTimestamp=0;bodyDetectedFrames=0;noBodyFrames=0;isCalibrated=!1;AW=160;AH=120;constructor(){typeof document<"u"&&(this.analysisCanvas=document.createElement("canvas"),this.analysisCanvas.width=this.AW,this.analysisCanvas.height=this.AH,this.analysisCtx=this.analysisCanvas.getContext("2d",{willReadFrequently:!0}))}track(t,n,a){let i=performance.now(),o=n||640,r=a||480,s=null,c=.95,p=!0;if(this.analysisCtx&&this.analysisCanvas&&t)try{s=this.analyzeFrameOptical(t,o,r)}catch{s=null}(!s||s.length<19)&&(s=this.generateAdaptiveBasePose(o,r),c=.85,p=!0);let l=this.applyAdaptiveTemporalSmoothing(s,i);this.prevLandmarks=l,this.prevTimestamp=i;let d=l[5],u=l[6],m=l[11],g=l[12],f=u.x-d.x,b=u.y-d.y,x=Math.max(o*.15,Math.hypot(f,b)),v=Math.atan2(b,f),k={x:(d.x+u.x+m.x+g.x)/4,y:(d.y+u.y+m.y+g.y)/4},L=this.computeBodyMeasurements(l,o,r),B=Math.abs(l[0].y-l[17].y)*2/r,I="ideal",R="\u2726 Optical Tracking: 60 FPS \xB7 Active";return B>.4?(I="close_up",R="\u{1F4A1} Sit back slightly for full shirt view"):B<.12&&(I="far",R="Step closer for detailed fit"),{landmarks:l,confidence:c,timestamp:i,isBodyDetected:p,shoulderAngle:v,shoulderWidth:x,torsoCenter:k,measurements:L,framingStatus:I,statusText:R}}analyzeFrameOptical(t,n,a){let i=this.analysisCtx,o=this.AW,r=this.AH;i.drawImage(t,0,0,o,r);let c=i.getImageData(0,0,o,r).data,p=0,l=0,d=0,u=r,m=0,g=o,f=0,b=Math.floor(r*.65);for(let E=5;E<b;E+=2){let N=E*o;for(let O=8;O<o-8;O+=2){let G=(N+O)*4,ve=c[G],Ye=c[G+1],Jt=c[G+2];this.isSkinPixel(ve,Ye,Jt)&&(p+=O,l+=E,d++,E<u&&(u=E),E>m&&(m=E),O<g&&(g=O),O>f&&(f=O))}}let x=.5,v=.32,k=.22,L=.24;d>=25?(x=p/d/o,v=l/d/r,k=Math.max(.14,Math.min(.38,(f-g)/o)),L=Math.max(.16,Math.min(.36,(m-u)/r)),this.bodyDetectedFrames++,this.noBodyFrames=0):(this.noBodyFrames++,x=.5,v=.35);let W=L>=.22,B=Math.min(.66,v+L*.54),I=Math.min(.72,v+L*.62),R=Math.floor(I*r),T=Math.floor(x*o),F=Math.max(o*.16,Math.min(o*.38,k*1.25*o)),M=Math.max(2,T-Math.floor(F)),H=Math.min(o-3,T+Math.floor(F)),ee=Math.min(r-4,Math.max(4,R)),S={r:c[0],g:c[1],b:c[2]},C={r:c[(o-1)*4],g:c[(o-1)*4+1],b:c[(o-1)*4+2]};for(let E=T-2;E>=4;E-=2){let N=(ee*o+E)*4,O=c[N],G=c[N+1],ve=c[N+2];if(Math.hypot(O-S.r,G-S.g,ve-S.b)<28){M=E+2;break}}for(let E=T+2;E<o-4;E+=2){let N=(ee*o+E)*4,O=c[N],G=c[N+1],ve=c[N+2];if(Math.hypot(O-C.r,G-C.g,ve-C.b)<28){H=E-2;break}}let te=o*.32,Y=o*.82,P=H-M;if(P<te){let E=(te-P)/2;M=Math.max(2,M-E),H=Math.min(o-3,H+E),P=H-M}else if(P>Y){let E=(P-Y)/2;M+=E,H-=E,P=H-M}let ae=Math.max(.1,v-L*.15)*a,ge=v*a,U=x*n,Ce=k*.28*n,fe={x:U-Ce,y:ae,v:.95},ne={x:U+Ce,y:ae,v:.95},Xe={x:U,y:ge,v:.98},be={x:U-k*.52*n,y:ge,v:.9},he={x:U+k*.52*n,y:ge,v:.9},je={x:U,y:Math.max(0,(v-L*.65)*a),v:.92},q=M/o*n,re=H/o*n,X=I*a,Dt=B*a,Ft={x:(q+re)/2,y:Dt,v:.96},Ut={x:q,y:X,v:.95},Nt={x:re,y:X,v:.95},oe=Math.abs(re-q),Ie=W?Math.max(a*.36,(a-X)*.95):oe*1.2,_e=Math.min(a*.98,X+Ie),pt=oe*.44,ut=(q+re)/2,Ve={x:ut-pt,y:_e,v:.92},We={x:ut+pt,y:_e,v:.92},Ae=Ie*.52,mt=Ie*.46,$t={x:q-oe*.12,y:X+Ae,v:.88},qt={x:re+oe*.12,y:X+Ae,v:.88},Xt={x:q-oe*.16,y:X+Ae+mt*.7,v:.86},jt={x:re+oe*.16,y:X+Ae+mt*.7,v:.86},gt=Ie*.85,ft=Math.min(a*.98,_e+gt*.5),bt=Math.min(a*1,_e+gt),Vt={x:Ve.x,y:ft,v:.8},Wt={x:We.x,y:ft,v:.8},Yt={x:Ve.x,y:bt,v:.75},Gt={x:We.x,y:bt,v:.75};return[Xe,fe,ne,be,he,Ut,Nt,$t,qt,Xt,jt,Ve,We,Vt,Wt,Yt,Gt,je,Ft]}isSkinPixel(t,n,a){if(t<60||n<40||a<20||t<=n||t<=a||Math.abs(t-n)<12)return!1;let i=Math.max(t,n,a),o=Math.min(t,n,a);return i-o>15}generateAdaptiveBasePose(t,n){let a=t*.5,i=n*.36,o=n*.31,r=n*.5,s=n*.58,c=t*.3,p=n*.38,l=Math.min(n*.98,s+p);return[{x:a,y:i,v:.95},{x:a-t*.06,y:o,v:.95},{x:a+t*.06,y:o,v:.95},{x:a-t*.12,y:i,v:.9},{x:a+t*.12,y:i,v:.9},{x:a-c,y:s,v:.95},{x:a+c,y:s,v:.95},{x:a-c*1.15,y:s+p*.5,v:.88},{x:a+c*1.15,y:s+p*.5,v:.88},{x:a-c*1.25,y:s+p*.85,v:.86},{x:a+c*1.25,y:s+p*.85,v:.86},{x:a-c*.85,y:l,v:.85},{x:a+c*.85,y:l,v:.85},{x:a-c*.8,y:n*.98,v:.8},{x:a+c*.8,y:n*.98,v:.8},{x:a-c*.8,y:n*1,v:.78},{x:a+c*.8,y:n*1,v:.78},{x:a,y:n*.2,v:.92},{x:a,y:r,v:.95}]}applyAdaptiveTemporalSmoothing(t,n){if(!this.prevLandmarks||this.prevLandmarks.length!==t.length)return t;let a=[],i=0;for(let s=0;s<t.length;s++)i+=Math.hypot(t[s].x-this.prevLandmarks[s].x,t[s].y-this.prevLandmarks[s].y);let o=i/t.length,r=Math.max(.2,Math.min(.75,o/15));for(let s=0;s<t.length;s++){let c=t[s],p=this.prevLandmarks[s],l=p.x*(1-r)+c.x*r,d=p.y*(1-r)+c.y*r,u=(p.v||.9)*(1-r)+(c.v||.9)*r;a.push({x:l,y:d,v:u})}return a}computeBodyMeasurements(t,n,a){let i=t[5],o=t[6],r=t[11],s=t[12],c=t[18],p=Math.hypot(o.x-i.x,o.y-i.y),l=Math.hypot(s.x-r.x,s.y-r.y),d=Math.hypot((i.x+o.x)/2-(r.x+s.x)/2,(i.y+o.y)/2-(r.y+s.y)/2),m=Math.max(1,p/44),g=Math.round(p/m),f=Math.round(p*2.3/m),b=Math.round(l*2.1/m),x=Math.round(d/m),v="M";return f<88?v="XS":f<96?v="S":f<104?v="M":f<112?v="L":f<120?v="XL":v="XXL",{shoulderWidthCm:g,chestCircumferenceCm:f,waistCircumferenceCm:b,torsoHeightCm:x,shoulderWidthPx:Math.round(p),torsoHeightPx:Math.round(d),recommendedSize:v}}reset(){this.prevLandmarks=null,this.prevTimestamp=0,this.bodyDetectedFrames=0,this.noBodyFrames=0}};var Be=class{smoothedVertices=new Map;prevTimestamp=0;flipU=!1;tempCanvas=null;tempCtx=null;constructor(){typeof document<"u"&&(this.tempCanvas=document.createElement("canvas"),this.tempCtx=this.tempCanvas.getContext("2d",{willReadFrequently:!0}))}renderTryOn(t,n,a,i,o={}){if(!i||i.length<13||!n||!a)return;let r=t.canvas.width,s=t.canvas.height,{fitScale:c=1,fitOffsetY:p=0,fitOpacity:l=1,enableLightingTransfer:d=!0,enableArmOcclusion:u=!0,isMirrored:m=!1}=o;this.flipU=!!m;let{vertices:g,triangles:f}=this.buildAnatomicalMesh(i,r,s,c,p),b=this.applyTemporalSmoothing(g);t.save(),t.globalAlpha=Math.max(.1,Math.min(1,l)),this.renderTexturedMesh(t,a,b,f),d&&this.applyAmbientLightingTransfer(t,n,b,r,s),t.restore(),u&&this.renderArmOcclusion(t,n,i,r,s,m)}buildAnatomicalMesh(t,n,a,i,o){let r=t[0]||{x:n*.5,y:a*.35},s=t[5]||{x:n*.35,y:a*.55},c=t[6]||{x:n*.65,y:a*.55},p=t[7]||{x:n*.28,y:a*.72},l=t[8]||{x:n*.72,y:a*.72},d=t[11]||{x:n*.38,y:a*.95},u=t[12]||{x:n*.62,y:a*.95},m=t[18]||{x:(s.x+c.x)/2,y:(s.y+c.y)/2-a*.05},g=Math.hypot(c.x-s.x,c.y-s.y),f=(s.x+c.x)/2,b=(s.y+c.y)/2,x=(d.x+u.x)/2,v=(d.y+u.y)/2,k=x-f,L=v-b,W=Math.max(a*.3,Math.hypot(k,L)),B=g/2*i*1.08,I=o*20,R=5,T=5,F=[],M=[],H=[0,.22,.5,.78,1],ee=[.85,1.15,1.05,.94,1.02];for(let S=0;S<R;S++){let C=H[S],te=f+k*C,Y=b+L*C+I,P=Math.atan2(L,k)-Math.PI/2,ae=Math.cos(P),ge=Math.sin(P),U=B*ee[S],Ce=Math.sin(C*Math.PI)*(g*.08);for(let fe=0;fe<T;fe++){let ne=fe/(T-1),Xe=C,be=(ne-.5)*2,he=0;S===0?he=Math.cos((ne-.5)*Math.PI)*(a*.035):S===1&&(he=(1-Math.abs(be))*(a*.015));let je=te+ae*(be*U),q=Y+ge*(be*U)+he+Ce;F.push({u:this.flipU?1-ne:ne,v:Xe,x:je,y:q})}}for(let S=0;S<R-1;S++)for(let C=0;C<T-1;C++){let te=S*T+C,Y=S*T+(C+1),P=(S+1)*T+C,ae=(S+1)*T+(C+1);M.push({i0:te,i1:Y,i2:P}),M.push({i0:Y,i1:ae,i2:P})}return this.appendSleeveMesh(F,M,s,p,c,l,T),{vertices:F,triangles:M}}appendSleeveMesh(t,n,a,i,o,r,s){let c=i.x-a.x,p=i.y-a.y,l=t.length;t.push({u:this.flipU?1:0,v:.35,x:a.x+c*.45,y:a.y+p*.45}),n.push({i0:0,i1:s,i2:l});let d=r.x-o.x,u=r.y-o.y,m=t.length;t.push({u:this.flipU?0:1,v:.35,x:o.x+d*.45,y:o.y+u*.45}),n.push({i0:s-1,i1:s*2-1,i2:m})}applyTemporalSmoothing(t){let a=[];for(let i=0;i<t.length;i++){let o=t[i],r=`v_${i}`,s=this.smoothedVertices.get(r);if(!s)this.smoothedVertices.set(r,{x:o.x,y:o.y}),a.push({...o});else{let c=s.x*.72+o.x*.28,p=s.y*(1-.28)+o.y*.28;this.smoothedVertices.set(r,{x:c,y:p}),a.push({u:o.u,v:o.v,x:c,y:p})}}return a}renderTexturedMesh(t,n,a,i){let o=n.naturalWidth||n.width||800,r=n.naturalHeight||n.height||800;for(let s of i){let c=a[s.i0],p=a[s.i1],l=a[s.i2];if(!c||!p||!l)continue;let d=c.u*o,u=c.v*r,m=p.u*o,g=p.v*r,f=l.u*o,b=l.v*r,x=c.x,v=c.y,k=p.x,L=p.y,W=l.x,B=l.y,I=d*(g-b)-u*(m-f)+(m*b-f*g);if(Math.abs(I)<1e-6)continue;let R=(x*(g-b)+k*(b-u)+W*(u-g))/I,T=(v*(g-b)+L*(b-u)+B*(u-g))/I,F=(x*(f-m)+k*(d-f)+W*(m-d))/I,M=(v*(f-m)+L*(d-f)+B*(m-d))/I,H=x-R*d-F*u,ee=v-T*d-M*u;t.save(),t.beginPath(),t.moveTo(x,v),t.lineTo(k,L),t.lineTo(W,B),t.closePath(),t.clip(),t.transform(R,T,F,M,H,ee),t.drawImage(n,0,0),t.restore()}}applyAmbientLightingTransfer(t,n,a,i,o){if(!this.tempCanvas||!this.tempCtx||a.length<5)return;(this.tempCanvas.width!==i||this.tempCanvas.height!==o)&&(this.tempCanvas.width=i,this.tempCanvas.height=o);let r=this.tempCtx;r.clearRect(0,0,i,o),r.drawImage(n,0,0,i,o),t.save(),t.beginPath();let s=[a[0],a[1],a[2],a[3],a[4]],c=[a[20],a[21],a[22],a[23],a[24]];t.moveTo(s[0].x,s[0].y);for(let p=1;p<s.length;p++)t.lineTo(s[p].x,s[p].y);for(let p=c.length-1;p>=0;p--)t.lineTo(c[p].x,c[p].y);t.closePath(),t.clip(),t.globalCompositeOperation="multiply",t.globalAlpha=.22,t.drawImage(this.tempCanvas,0,0),t.restore()}renderArmOcclusion(t,n,a,i,o,r){let s=a[5],c=a[6],p=a[7],l=a[8],d=a[9],u=a[10],m=a[11],g=a[12];if(!s||!c||!m||!g)return;let f=Math.min(s.x,c.x)-i*.05,b=Math.max(s.x,c.x)+i*.05,x=Math.min(s.y,c.y),v=Math.max(m.y,g.y),k=d&&d.x>=f&&d.x<=b&&d.y>=x&&d.y<=v,L=u&&u.x>=f&&u.x<=b&&u.y>=x&&u.y<=v;!k&&!L||(t.save(),k&&p&&d&&this.drawOcclusionArmSegment(t,n,p,d,i*.07),L&&l&&u&&this.drawOcclusionArmSegment(t,n,l,u,i*.07),t.restore())}drawOcclusionArmSegment(t,n,a,i,o){let s=Math.atan2(i.y-a.y,i.x-a.x)+Math.PI/2,c=o/2,p=Math.cos(s)*c,l=Math.sin(s)*c;t.save(),t.beginPath(),t.moveTo(a.x-p,a.y-l),t.lineTo(a.x+p,a.y+l),t.lineTo(i.x+p,i.y+l),t.lineTo(i.x-p,i.y-l),t.closePath(),t.clip(),t.drawImage(n,0,0,t.canvas.width,t.canvas.height),t.restore()}reset(){this.smoothedVertices.clear(),this.prevTimestamp=0}};var dt=new Be,Pt=new Re,Ct="vestora-panel-host",ra=420,oa={NOSE:0,LEFT_EYE:1,RIGHT_EYE:2,LEFT_EAR:3,RIGHT_EAR:4,LEFT_SHOULDER:5,RIGHT_SHOULDER:6,LEFT_ELBOW:7,RIGHT_ELBOW:8,LEFT_WRIST:9,RIGHT_WRIST:10,LEFT_HIP:11,RIGHT_HIP:12,LEFT_KNEE:13,RIGHT_KNEE:14,LEFT_ANKLE:15,RIGHT_ANKLE:16,HEAD_CROWN:17,NECK:18},sa={XS:{shoulder:[36,39],chest:[81,87],waist:[66,72]},S:{shoulder:[39,42],chest:[87,93],waist:[72,78]},M:{shoulder:[42,45],chest:[93,99],waist:[78,84]},L:{shoulder:[45,48],chest:[99,107],waist:[84,92]},XL:{shoulder:[48,52],chest:[107,115],waist:[92,100]},XXL:{shoulder:[52,56],chest:[115,124],waist:[100,110]}},It=[{name:"Oversized Minimalist Jacket",category:"Jacket",garmentCategory:"upper_body",imageUrl:"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",availableSizes:["S","M","L","XL"]},{name:"Streetwear Graphic Hoodie",category:"Hoodie",garmentCategory:"upper_body",imageUrl:"https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",availableSizes:["M","L","XL","XXL"]},{name:"Classic Aviator Sunglasses",category:"Sunglasses",garmentCategory:"eyewear",imageUrl:"https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80",availableSizes:["One Size"]},{name:"Urban Snapback Cap",category:"Hat",garmentCategory:"headwear",imageUrl:"https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80",availableSizes:["One Size"]}],_t=0,$=null,y=null,V=null,Z=null,_=[],me=.88,D=1,le=0,Q="user",Te=!1,tt=!1,w=null,A=null,h=null,Le=null,nt=null,rt=null,ie=null,ke=null,ot=null,st=null,it=null,ct=null,lt=null,Ne=null,ce=null,Ot=null,K=null,De=null,Fe=null,ia=`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* \u2500\u2500 Panel Shell \u2500\u2500 */
  .v-panel {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${ra}px;
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
`;function ca(){return`
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
  `}function Se(e){if($&&y){qe(e,!1),z(`\u2726 Added ${e.name.slice(0,28)}\u2026`);return}la(e)}function la(e){document.getElementById(Ct)?.remove(),$e(),$=document.createElement("div"),$.id=Ct,$.style.cssText="position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483646!important;",document.documentElement.appendChild($),y=$.attachShadow({mode:"open"});let t=document.createElement("style");t.textContent=ia,y.appendChild(t);let n=document.createElement("div");n.innerHTML=ca(),y.appendChild(n);let a=y.getElementById("v-panel");a.style.pointerEvents="all";let i=y.getElementById("v-toggle-tab");i.style.pointerEvents="all",w=y.getElementById("v-video"),A=y.getElementById("v-canvas"),Le=y.getElementById("v-camera-blocked"),nt=y.getElementById("v-product-name"),rt=y.getElementById("v-product-cat"),ie=y.getElementById("v-product-thumb"),ke=y.getElementById("v-outfit-list"),ot=y.getElementById("v-outfit-count"),st=y.getElementById("v-meas-shoulder"),it=y.getElementById("v-meas-chest"),ct=y.getElementById("v-meas-waist"),lt=y.getElementById("v-meas-torso"),Ne=y.getElementById("v-rec-size"),ce=y.getElementById("v-sizes-row"),Ot=y.getElementById("v-fit-panel"),K=y.getElementById("v-fit-scale-val"),De=y.getElementById("v-opacity-slider"),Fe=y.getElementById("v-toast"),h=A.getContext("2d",{desynchronized:!0,alpha:!0}),requestAnimationFrame(()=>requestAnimationFrame(()=>{a.classList.add("is-open"),i.classList.remove("hidden")})),da(),e&&qe(e,!0),Ee("user")}function da(){let e=y,t=e.getElementById("v-panel"),n=e.getElementById("v-toggle-tab");e.getElementById("v-btn-close").addEventListener("click",At),n.addEventListener("click",()=>{t.classList.add("is-open"),n.classList.add("hidden"),V||Ee(Q)}),e.getElementById("v-btn-flip").addEventListener("click",()=>{Ee(Q==="user"?"environment":"user")}),e.getElementById("v-btn-fit").addEventListener("click",()=>{tt=!tt,Ot.classList.toggle("open",tt)}),e.getElementById("v-btn-screenshot").addEventListener("click",Ma),e.getElementById("v-btn-retry-cam").addEventListener("click",()=>{Le.classList.add("hidden"),Ee(Q)}),e.getElementById("v-btn-use-photo").addEventListener("click",()=>{e.getElementById("v-photo-input").click()}),e.getElementById("v-photo-input").addEventListener("change",o=>{let r=o.target.files?.[0];if(!r)return;let s=new FileReader;s.onload=c=>{let p=new Image;p.onload=()=>{$e(),A&&(A.width=p.naturalWidth,A.height=p.naturalHeight),Le.classList.add("hidden"),w&&(w.style.display="none"),Te=!0,z("\u2726 Photo loaded \u2014 try-on active!"),zt()},p.src=c.target.result},s.readAsDataURL(r)}),e.getElementById("v-btn-grab").addEventListener("click",()=>{z("Hover any clothing image \u2192 click \u2726 Try with VESTORA")}),e.getElementById("v-btn-sample").addEventListener("click",pa),e.getElementById("v-btn-add").addEventListener("click",()=>{z("Hover any clothing image \u2192 click \u2726 Try with VESTORA")}),e.getElementById("v-btn-clear").addEventListener("click",()=>{_=[],ue(),z("Cleared all items")}),e.getElementById("v-fit-scale-down").addEventListener("click",()=>{D=Math.max(.5,D-.05),se(),K&&(K.textContent=`${Math.round(D*100)}%`)}),e.getElementById("v-fit-scale-up").addEventListener("click",()=>{D=Math.min(2.5,D+.05),se(),K&&(K.textContent=`${Math.round(D*100)}%`)}),e.getElementById("v-fit-up").addEventListener("click",()=>{le-=10,se()}),e.getElementById("v-fit-down").addEventListener("click",()=>{le+=10,se()}),e.getElementById("v-fit-reset").addEventListener("click",()=>{D=1,le=0,me=.88,K&&(K.textContent="100%"),De&&(De.value="88"),se()}),De.addEventListener("input",o=>{me=parseInt(o.target.value)/100,se()}),e.getElementById("v-btn-camera").addEventListener("click",()=>{e.getElementById("v-btn-camera").classList.add("active"),e.getElementById("v-btn-photo").classList.remove("active"),w&&(w.style.display="block"),V||Ee(Q)}),e.getElementById("v-btn-photo").addEventListener("click",()=>{e.getElementById("v-btn-photo").classList.add("active"),e.getElementById("v-btn-camera").classList.remove("active"),e.getElementById("v-photo-input").click()});let a=e.getElementById("v-drop-overlay"),i=0;t.addEventListener("dragenter",o=>{o.preventDefault(),i++,a?.classList.remove("hidden")}),t.addEventListener("dragover",o=>{o.preventDefault(),o.dataTransfer&&(o.dataTransfer.dropEffect="copy"),a?.classList.remove("hidden")}),t.addEventListener("dragleave",o=>{o.preventDefault(),i--,i<=0&&(i=0,a?.classList.add("hidden"))}),t.addEventListener("drop",async o=>{o.preventDefault(),i=0,a?.classList.add("hidden");let r=null,s="Dropped Garment";if(o.dataTransfer?.files&&o.dataTransfer.files.length>0){let c=o.dataTransfer.files[0];c.type.startsWith("image/")&&(s=c.name.replace(/\.[^/.]+$/,""),r=await new Promise(p=>{let l=new FileReader;l.onload=()=>p(l.result),l.readAsDataURL(c)}))}if(!r&&o.dataTransfer){let c=o.dataTransfer.getData("text/html");if(c)try{let p=document.createElement("div");p.innerHTML=c;let l=p.querySelector("img");l&&(r=l.currentSrc||l.src||l.getAttribute("data-src")||l.getAttribute("data-zoom-src"),l.alt&&(s=l.alt.trim()))}catch{}}if(!r&&o.dataTransfer){let c=o.dataTransfer.getData("text/uri-list")||o.dataTransfer.getData("URL");c&&(c.startsWith("http")||c.startsWith("data:image/"))&&(r=c.trim().split(`
`)[0])}if(!r&&o.dataTransfer){let c=o.dataTransfer.getData("text/plain");c&&(c.startsWith("http://")||c.startsWith("https://")||c.startsWith("data:image/"))&&(r=c.trim())}if(r){let c={id:`drop_${Date.now()}`,name:s,imageUrl:r,category:"Clothing",garmentCategory:Rt(s,"Clothing"),availableSizes:["XS","S","M","L","XL","XXL"]};qe(c,!0),z(`\u2726 Trying on: ${s.slice(0,24)}\u2026`)}else z("\u26A0 Could not detect clothing image from drop")}),document.addEventListener("keydown",o=>{o.key==="Escape"&&$&&At()})}function se(){_.filter(e=>e.enabled).forEach(e=>{e.scale=D,e.offsetY=le,e.opacity=me})}function pa(){let e=It[_t%It.length];_t++,qe({id:`sample_${Date.now()}`,name:e.name,category:e.category,brand:"VESTORA Sample",imageUrl:e.imageUrl,productUrl:"",pageUrl:"",isFashion:!0,availableSizes:e.availableSizes,outOfStockSizes:[],confidence:1,detectionSource:"dom-heuristic",garmentCategory:e.garmentCategory},!1)}function At(){let e=y?.getElementById("v-panel"),t=y?.getElementById("v-toggle-tab");e&&(e.classList.remove("is-open"),t?.classList.add("hidden"),setTimeout(()=>{$e(),Pt.reset(),dt.reset(),$?.remove(),$=null,y=null,_=[],Te=!1},420))}async function Ee(e){$e(),Le?.classList.add("hidden"),de(!0,"Starting camera\u2026");let t=window.navigator.mediaDevices;if(!t||!t.getUserMedia){console.error("[VESTORA] navigator.mediaDevices not available"),Ht("Camera API not available in this browser.");return}let n=[{video:{facingMode:{ideal:e},width:{ideal:1280},height:{ideal:720}},audio:!1},{video:{facingMode:{ideal:e}},audio:!1},{video:!0,audio:!1}],a;for(let i of n)try{V=await t.getUserMedia(i),await ua(V,e);return}catch(o){a=o,console.warn("[VESTORA] getUserMedia variant failed:",o)}console.error("[VESTORA] All camera variants failed:",a),Ht()}async function ua(e,t){w&&(Q=t,w.srcObject=e,w.style.transform=t==="user"?"scaleX(-1)":"",w.style.display="block",await new Promise(n=>{w.onloadedmetadata=()=>w.play().then(n).catch(n)}),ma(),setTimeout(()=>{Te=!0,de(!1,"Body Detected \u2713"),z("\u2726 Camera active \u2014 live try-on ready!"),zt()},1100))}function $e(){Z&&(cancelAnimationFrame(Z),Z=null),V&&(V.getTracks().forEach(e=>e.stop()),V=null),Te=!1}function Ht(e){de(!0,"No Camera");let t=y?.getElementById("v-camera-error-msg");t&&(t.textContent=e||"Camera permission was denied or no camera found. Click \u21BA Retry after allowing camera in browser settings, or use Photo mode."),Le?.classList.remove("hidden")}function de(e,t){let n=y?.getElementById("v-detect-ring");if(!n)return;n.classList.toggle("detecting",e);let a=n.querySelector("span");a&&(a.textContent=t)}function ma(){!w||!A||(A.width=w.videoWidth||640,A.height=w.videoHeight||480)}function zt(){Z&&cancelAnimationFrame(Z);function e(){if(Z=requestAnimationFrame(e),!h||!A)return;let t=A.width,n=A.height;if(!t||!n)return;let a=w&&w.videoWidth?w:A,i=Pt.track(a,t,n);i.framingStatus==="close_up"?de(!0,"\u{1F4A1} Sit back slightly for full view"):i.isBodyDetected?(Te=!0,de(!1,`\u2726 Live Tracking (${i.framingStatus==="far"?"Full Body":"Torso"})`)):de(!0,"Looking for body\u2026");let o={landmarks:i.landmarks};Ea(o,t,n),h.clearRect(0,0,t,n),ga(o,t,n,Q==="user"&&!!V)}Z=requestAnimationFrame(e)}function ga(e,t,n,a){let i=["lower_body","full_body","upper_body","belt","necklace","scarf","bag","wristwear","ring","earrings","eyewear","headwear"],o=_.filter(r=>r.enabled).sort((r,s)=>i.indexOf(r.garmentCategory)-i.indexOf(s.garmentCategory));for(let r of o){let s=r.processedCanvas||r.imageElement;if(s)switch(r.garmentCategory){case"eyewear":va(e.landmarks,t,n,r,s,a);break;case"headwear":ya(e.landmarks,t,n,r,s,a);break;case"necklace":xa(e.landmarks,t,n,r,s,a);break;case"wristwear":wa(e.landmarks,t,n,r,s,a);break;case"lower_body":ba(e.landmarks,t,n,r,s,a);break;case"full_body":ha(e.landmarks,t,n,r,s,a);break;default:fa(e.landmarks,t,n,r,s,a);break}}}var pe=oa;function fa(e,t,n,a,i,o){if(w&&w.videoWidth&&i){dt.renderTryOn(h,w,i,e,{fitScale:a.scale*D,fitOffsetY:a.offsetY+le,fitOpacity:a.opacity*me,enableLightingTransfer:!0,enableArmOcclusion:!0,isMirrored:o});return}let r=e[pe.LEFT_SHOULDER],s=e[pe.RIGHT_SHOULDER],c=e[pe.LEFT_HIP];if(!r||!s||!c)return;let p=Math.abs(s.x-r.x),l=Math.abs(c.y-r.y),d=p*2.2*a.scale,u=l*1.45*a.scale,m=(r.x+s.x)/2,g=r.y-u*.08+a.offsetY,f=o?t-m-d/2:m-d/2,b=Math.atan2(s.y-r.y,s.x-r.x);h.save(),h.globalAlpha=a.opacity,h.translate(f+d/2,g+u/2),h.rotate(o?-b:b),h.translate(-(f+d/2),-(g+u/2)),h.drawImage(i,f,g,d,u),h.restore()}function ba(e,t,n,a,i,o){let r=e[pe.LEFT_HIP],s=e[pe.RIGHT_HIP],c=e[pe.LEFT_ANKLE];if(!r||!s||!c)return;let p=Math.abs(s.x-r.x),l=Math.abs(c.y-r.y),d=p*1.8*a.scale,u=l*1.15*a.scale,m=(r.x+s.x)/2,g=r.y-u*.05+a.offsetY,f=o?t-m-d/2:m-d/2;h.save(),h.globalAlpha=a.opacity,h.drawImage(i,f,g,d,u),h.restore()}function ha(e,t,n,a,i,o){if(w&&w.videoWidth&&i){dt.renderTryOn(h,w,i,e,{fitScale:a.scale*D*1.08,fitOffsetY:a.offsetY+le,fitOpacity:a.opacity*me,enableLightingTransfer:!0,enableArmOcclusion:!0,isMirrored:o});return}let r=e[5],s=e[6],c=e[15];if(!r||!s||!c)return;let p=Math.abs(s.x-r.x),l=Math.abs(c.y-r.y),d=p*2.3*a.scale,u=l*1.25*a.scale,m=(r.x+s.x)/2,g=r.y-u*.04+a.offsetY,f=o?t-m-d/2:m-d/2;h.save(),h.globalAlpha=a.opacity,h.drawImage(i,f,g,d,u),h.restore()}function va(e,t,n,a,i,o){let r=e[1],s=e[2];if(!r||!s)return;let c=s.x-r.x,p=s.y-r.y,l=Math.sqrt(c*c+p*p),d=Math.atan2(p,c),u=l*2.35*a.scale,m=u*.44,g=(r.x+s.x)/2,f=(r.y+s.y)/2+a.offsetY,b=o?t-g-u/2:g-u/2;h.save(),h.globalAlpha=a.opacity,h.translate(b+u/2,f),h.rotate(o?-d:d),h.translate(-(b+u/2),-f),h.drawImage(i,b,f-m/2,u,m),h.restore()}function ya(e,t,n,a,i,o){let r=e[17],s=e[5],c=e[6];if(!r||!s||!c)return;let l=Math.abs(c.x-s.x)*.78*a.scale,d=l*.72,u=r.x,m=r.y-d*.38+a.offsetY,g=o?t-u-l/2:u-l/2;h.save(),h.globalAlpha=a.opacity,h.drawImage(i,g,m-d/2,l,d),h.restore()}function xa(e,t,n,a,i,o){let r=e[18],s=e[5],c=e[6];if(!r||!s||!c)return;let l=Math.abs(c.x-s.x)*.62*a.scale,d=l*.85,u=r.x,m=r.y+d*.15+a.offsetY,g=o?t-u-l/2:u-l/2;h.save(),h.globalAlpha=a.opacity,h.drawImage(i,g,m-d/2,l,d),h.restore()}function wa(e,t,n,a,i,o){let r=e[9],s=e[5],c=e[6];if(!r||!s||!c)return;let l=Math.abs(c.x-s.x)*.32*a.scale,d=l*1.05,u=r.x,m=r.y+a.offsetY,g=o?t-u-l/2:u-l/2;h.save(),h.globalAlpha=a.opacity,h.drawImage(i,g,m-d/2,l,d),h.restore()}function ka(e){try{let t=e.naturalWidth,n=e.naturalHeight;if(!t||!n)return null;let a=document.createElement("canvas");a.width=t,a.height=n;let i=a.getContext("2d",{willReadFrequently:!0});i.drawImage(e,0,0);let o=i.getImageData(0,0,t,n),r=o.data,s=[0,(t-1)*4,(n-1)*t*4,(n*t-1)*4],c=0,p=0,l=0;if(s.forEach(d=>{c+=r[d],p+=r[d+1],l+=r[d+2]}),c/=4,p/=4,l/=4,c>210&&p>210&&l>210){for(let d=0;d<r.length;d+=4){let u=Math.sqrt((r[d]-c)**2+(r[d+1]-p)**2+(r[d+2]-l)**2);u<42&&(r[d+3]=Math.round(r[d+3]*Math.max(0,(u-14)/28)))}return i.putImageData(o,0,0),a}return null}catch{return null}}function Rt(e="",t=""){let n=`${e} ${t}`.toLowerCase();return/sunglass|glasses|eyewear|aviator|shades|spectacle/i.test(n)?"eyewear":/\bcap\b|hat|beanie|snapback|fedora|visor/i.test(n)?"headwear":/necklace|chain|pendant|choker|collar/i.test(n)?"necklace":/earring|stud|jhumka|hoop/i.test(n)?"earrings":/watch|bracelet|bangle|wristband|kada/i.test(n)?"wristwear":/bag|handbag|backpack|tote|purse|clutch/i.test(n)?"bag":/belt|sash/i.test(n)?"belt":/pant|trouser|jean|skirt|shorts|legging/i.test(n)?"lower_body":/dress|gown|saree|sari|lehenga|jumpsuit|anarkali/i.test(n)?"full_body":"upper_body"}function Bt(e){return{eyewear:"Eyewear",headwear:"Hat",necklace:"Necklace",earrings:"Earrings",wristwear:"Watch",bag:"Bag",belt:"Belt",lower_body:"Bottoms",full_body:"Full Outfit",upper_body:"Top"}[e]||"Top"}function qe(e,t){let n=e.garmentCategory||Rt(e.name,e.category),a=e.id||`layer_${Date.now()}`;t&&(_=[]);let i={id:a,name:e.name||"Fashion Item",category:e.category||"Garment",garmentCategory:n,imageUrl:e.imageUrl,enabled:!0,scale:1,offsetY:0,opacity:me,imageElement:null,processedCanvas:null,availableSizes:e.availableSizes||["XS","S","M","L","XL","XXL"]},o=_.findIndex(s=>s.garmentCategory===n);o>=0?_[o]=i:_.push(i),nt&&(nt.textContent=i.name),rt&&(rt.textContent=`${Bt(n)} \xB7 ${i.category}`),ie&&(ie.style.display="block",ie.src=i.imageUrl,ie.onerror=()=>{ie.style.display="none"});let r=new Image;r.crossOrigin="anonymous",r.onload=()=>{i.imageElement=r,i.processedCanvas=ka(r),ue(),Ta(i.availableSizes),z(`\u2726 ${i.name.slice(0,26)} ready!`)},r.onerror=()=>{let s=new Image;s.onload=()=>{i.imageElement=s,ue()},s.src=i.imageUrl},r.src=i.imageUrl,ue(),Ue()}function ue(){if(ke){if(ke.innerHTML="",_.length===0){ke.innerHTML='<div class="v-outfit-empty">No items loaded yet. Try a sample or grab from the page.</div>',Ue();return}_.forEach(e=>{let t=document.createElement("div");t.className=`v-layer-card${e.enabled?"":" disabled"}`;let n=document.createElement("img");n.className="v-layer-thumb",n.src=e.imageUrl,n.alt=e.name,n.onerror=()=>{n.style.display="none"};let a=document.createElement("div");a.className="v-layer-info",a.innerHTML=`<div class="v-layer-cat">${Bt(e.garmentCategory)}</div><div class="v-layer-name" title="${e.name}">${e.name}</div>`;let i=document.createElement("div");i.className="v-layer-btns";let o=document.createElement("button");o.className=`v-layer-btn ${e.enabled?"on":""}`,o.textContent=e.enabled?"\u2713":"\u25CB",o.addEventListener("click",s=>{s.stopPropagation(),e.enabled=!e.enabled,ue()});let r=document.createElement("button");r.className="v-layer-btn remove",r.textContent="\xD7",r.addEventListener("click",s=>{s.stopPropagation(),_=_.filter(c=>c.id!==e.id),ue(),Ue(),z(`Removed ${e.name.slice(0,20)}`)}),i.appendChild(o),i.appendChild(r),t.appendChild(n),t.appendChild(a),t.appendChild(i),ke.appendChild(t)}),Ue()}}function Ue(){if(!ot)return;let e=_.filter(n=>n.enabled).length,t=_.length;ot.textContent=t===0?"0":e===t?`${t}`:e===0?"0/"+t:`${e}/${t}`}function Ea(e,t,n){let a=e.landmarks,i=a[5],o=a[6],r=a[11],s=a[12],c=(v,k)=>Math.sqrt((v.x-k.x)**2+(v.y-k.y)**2),p=c(i,o),l=c(r,s),d=c({x:(i.x+o.x)/2,y:(i.y+o.y)/2},{x:(r.x+s.x)/2,y:(r.y+s.y)/2}),u=Math.max(1,p/44),m=Math.round(p/u),g=Math.round(p*2.1/u),f=Math.round(l*2.4/u),b=Math.round(d/u);st&&(st.textContent=`${m} cm`),it&&(it.textContent=`${g} cm`),ct&&(ct.textContent=`${f} cm`),lt&&(lt.textContent=`${b} cm`);let x=La(m,g,f);Ne&&(Ne.textContent=x),Sa(x)}function La(e,t,n){let a="M",i=1/0;for(let[o,r]of Object.entries(sa)){let s=Math.abs(e-(r.shoulder[0]+r.shoulder[1])/2)*2+Math.abs(t-(r.chest[0]+r.chest[1])/2)+Math.abs(n-(r.waist[0]+r.waist[1])/2);s<i&&(i=s,a=o)}return a}function Ta(e){if(!ce)return;ce.innerHTML="";let t=Ne?.textContent||"M";e.forEach(n=>{let a=document.createElement("button");a.className=`v-size-pill${n===t?" rec":""}`,a.textContent=n,a.addEventListener("click",()=>{ce.querySelectorAll(".v-size-pill").forEach(i=>i.classList.remove("selected")),a.classList.add("selected"),z(`Selected size: ${n}`)}),ce.appendChild(a)})}function Sa(e){ce?.querySelectorAll(".v-size-pill").forEach(t=>{t.classList.toggle("rec",t.textContent===e)})}function Ma(){if(!w||!A)return;let e=document.createElement("canvas");e.width=w.videoWidth||640,e.height=w.videoHeight||480;let t=e.getContext("2d");Q==="user"?(t.scale(-1,1),t.drawImage(w,-e.width,0,e.width,e.height),t.scale(-1,1)):t.drawImage(w,0,0),t.drawImage(A,0,0),t.font="bold 14px Inter,sans-serif",t.fillStyle="rgba(255,255,255,0.75)",t.fillText("\u2726 VESTORA",12,e.height-12);let n=document.createElement("a");n.download=`vestora-${Date.now()}.png`,n.href=e.toDataURL(),n.click(),z("\u2726 Screenshot saved!")}var at=null;function z(e){let t=y?.getElementById("v-toast-text");!Fe||!t||(at&&clearTimeout(at),t.textContent=e,Fe.classList.add("visible"),at=setTimeout(()=>{Fe.classList.remove("visible")},2800))}var Me=new He("ProductDetector");(function(){if(window.__vestoraInitialized)return;window.__vestoraInitialized=!0,Me.info("VESTORA autonomous product detector active on",location.hostname);let t=null,n=!1;function a(){["#__decart-tryon-widget","#__decart-pill-btn",".vton-btn","[id*='decart']","[class*='anywear']","[id*='anywear']"].forEach(m=>{document.querySelectorAll(m).forEach(g=>{try{g.style.setProperty("display","none","important"),g.remove()}catch{}})})}if(location.hostname.toLowerCase().includes("google.")||St()){Me.info("Google Search/Images detected \u2014 activating dedicated Google Images Try-On Scanner"),Mt(p);return}a(),Lt(()=>{let u=t||c()||{id:`prod_dock_${Date.now()}`,name:document.title.split(/[-|·]/)[0].trim()||"Detected Apparel",brand:location.hostname.replace("www.","").split(".")[0].toUpperCase(),imageUrl:"",productUrl:location.href,pageUrl:location.href,category:"upper_body",isFashion:!0,availableSizes:["S","M","L","XL"],outOfStockSizes:[],confidence:1,detectionSource:"dom-heuristic"};Se(u),l("\u2726 VESTORA Live Try-On ready!")});let o=new IntersectionObserver(u=>{u.forEach(m=>{if(m.isIntersecting){let g=m.target;o.unobserve(g),J(g)&&we(g,p)}})},{rootMargin:"300px 0px"});function r(u=document){a(),Array.from(u.querySelectorAll("img")).forEach(b=>{b.complete&&b.naturalWidth>0?J(b)&&we(b,p):(b.addEventListener("load",()=>{J(b)&&we(b,p)},{once:!0}),o.observe(b))});let g=["[style*='background-image']",".image-grid-image",".image-grid-col",".pdp-image-container",".product-sliderContainer",".product-image",".img-container",".prod-image",".product__media",".product-single__photo",".product-media",".gallery-image","[data-testid*='product-image']","._396cs4","#landingImage",".product-base",".results-base"].join(", ");Array.from(u.querySelectorAll(g)).forEach(b=>{J(b)&&we(b,p)}),n||s()}function s(){let u=Ge(document,location);if(u.isProductPage){Me.info("Generic PDP detected with confidence:",u.confidence,"Signals:",u.signals);let m=Ke(document,location);m&&m.imageUrl&&(t=m,n=!0,chrome.runtime.sendMessage({type:"VESTORA_PRODUCT_DETECTED",payload:m}).catch(()=>{}),Et(m,p))}}function c(){if(t)return t;let u=Ke(document,location);if(u&&u.imageUrl)return t=u,u;let g=Array.from(document.querySelectorAll("img, [style*='background-image'], .image-grid-image, .image-grid-col")).filter(J);if(g.length>0){let f=g[0],b=xe(f);if(b)return t=Oe(f,b),t}return null}function p(u){Me.info("User requested try-on for:",u.name),t=u,Se(u),chrome.runtime.sendMessage({type:"VESTORA_PRODUCT_DETECTED",payload:u}).catch(()=>{}),l("\u2726 VESTORA Live Try-On ready!")}function l(u){let m=document.createElement("div");m.style.cssText=`
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(20px);
      background:linear-gradient(135deg,#7c3aed,#4f46e5); color:#fff;
      padding:12px 24px; border-radius:100px; font-family:'Inter',sans-serif;
      font-size:14px; font-weight:600; z-index:2147483647; opacity:0;
      box-shadow:0 8px 32px rgba(124,58,237,0.4); transition:all 0.3s cubic-bezier(.34,1.56,.64,1);
      white-space:nowrap; letter-spacing:0.02em;
    `,m.textContent=u,document.body.appendChild(m),requestAnimationFrame(()=>{m.style.opacity="1",m.style.transform="translateX(-50%) translateY(0)"}),setTimeout(()=>{m.style.opacity="0",m.style.transform="translateX(-50%) translateY(20px)",setTimeout(()=>m.remove(),400)},3e3)}r(document),new MutationObserver(()=>{r(document)}).observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{n||s()},1500),chrome.runtime.onMessage.addListener((u,m,g)=>{if(u&&u.type==="VESTORA_OPEN_TRYON"){Me.info("Received request to open try-on from popup/action");let f=t||c();if(f)Se(f),l("\u2726 VESTORA Live Try-On ready!"),g?.({success:!0,product:f});else{let b={id:`prod_popup_${Date.now()}`,name:"Browse & Try Fashion",brand:location.hostname.replace("www.","").split(".")[0].toUpperCase(),imageUrl:"",productUrl:location.href,pageUrl:location.href,category:"upper_body",isFashion:!0,availableSizes:["S","M","L","XL"],outOfStockSizes:[],confidence:1,detectionSource:"dom-heuristic"};Se(b),l("\u2726 VESTORA ready \u2014 hover any garment image!"),g?.({success:!0,product:b})}return!1}if(u&&u.type==="VESTORA_REQUEST_PAGE_PRODUCT"){let f=t||c();return g?.({success:!!f,product:f}),!1}})})();})();
