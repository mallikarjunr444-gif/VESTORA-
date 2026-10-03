"use strict";(()=>{var Y=class{namespace;constructor(t){this.namespace=t}format(t,a){let n=new Date().toISOString().split("T")[1].replace("Z","");return`[VESTORA:${this.namespace}] ${n} [${t.toUpperCase()}] ${a}`}debug(t,...a){typeof process<"u"}info(t,...a){console.info(this.format("info",t),...a)}warn(t,...a){console.warn(this.format("warn",t),...a)}error(t,...a){console.error(this.format("error",t),...a)}};var $e=[/\/(?:products?|items?|goods|catalog|dp|gp\/product|p)\/([^/?#]+)/i,/[?&](?:sku|product[-_]?id|item[-_]?id|pid|variant)=/i,/\/(?:buy|shop)\/([^/?#]+)/i,/\b[A-Za-z0-9_-]{5,16}(?:pdp|prd)\b/i],qe=[/\/(?:cart|checkout|basket|bag)\b/i,/\/(?:account|login|signin|register|signup|profile|my-account)\b/i,/\/(?:terms|privacy|contact|help|faq|about|policy|support|shipping)\b/i,/\/(?:search|categories|collections|c)\/?$/i,/\/(?:blog|article|stories|news)\//i],je=[/add\s*(?:to)?\s*(?:cart|bag|basket)/i,/buy\s*(?:it)?\s*now/i,/order\s*now/i,/bag\s*it/i,/quick\s*buy/i,/purchase/i,/add\s*to\s*tote/i],De=["\u20B9","$","\u20AC","\xA3","\xA5","Rs.","INR","USD","EUR","GBP","AED","AUD","CAD"];function se(e=document,t=location){let a=[],n=0,o=t.pathname||"";for(let u of qe)if(u.test(o))return{isProductPage:!1,confidence:0,signals:[`negative_url:${u}`]};for(let u of $e)if(u.test(t.href)){n+=.35,a.push("pdp_url_pattern");break}let c=null;try{let u=e.querySelectorAll('script[type="application/ld+json"]');for(let b of Array.from(u)){let v=b.textContent?.trim()||"";if(!v)continue;let E=JSON.parse(v),A=Array.isArray(E)?E:E["@graph"]?E["@graph"]:[E];for(let M of A)if(M&&(M["@type"]==="Product"||M["@type"]==="IndividualProduct")){c=M,n+=.5,a.push("json_ld_product");break}if(c)break}}catch{}c||e.querySelector('[itemscope][itemtype*="schema.org/Product"]')&&(n+=.4,a.push("microdata_product"));let r=e.querySelector('meta[property="og:type"]')?.getAttribute("content");r&&/product/i.test(r)&&(n+=.35,a.push("opengraph_product_type")),e.querySelector('meta[property="product:price:amount"], meta[property="og:price:amount"]')&&(n+=.25,a.push("opengraph_price"));let s=Array.from(e.querySelectorAll("button, input[type='submit'], input[type='button'], a[role='button'], .btn, .button")),d=!1;for(let u of s){let b=(u.textContent||u.getAttribute("aria-label")||u.getAttribute("value")||"").trim();if(b&&je.some(v=>v.test(b))){d=!0,n+=.3,a.push(`add_to_cart_btn:${b.slice(0,20)}`);break}}let g=["[class*='price']","[id*='price']","[data-price]",".pdp-price",".product-price",".price-box"],l=!1;for(let u of g){let b=e.querySelector(u);if(b){let v=b.textContent||"";if(De.some(E=>v.includes(E))||/\d+[.,]\d{2}/.test(v)){l=!0,n+=.2,a.push("dom_price_indicator");break}}}e.querySelector("[class*='size-selector'], [class*='size-buttons'], select[name*='size'], [data-testid*='size'], .size-swatches, [role='radiogroup'][aria-label*='size' i]")&&(n+=.2,a.push("dom_size_selector"));let p=Math.min(1,n);return{isProductPage:p>=.45,confidence:p,signals:a,rawJsonLd:c||void 0}}var Ge=[/\b(?:smartphone|iphone|samsung\s*galaxy|android|laptop|macbook|computer|charger|usb|cable|keyboard|mouse|headphone|earbud|speaker|monitor|television|smartwatch)\b/i,/\b(?:sofa|couch|dining\s*table|bedsheet|pillow|mattress|curtain|blanket|kitchenware|cooker|pan|knife|cutlery|refrigerator|microwave)\b/i,/\b(?:shampoo|conditioner|face\s*wash|lotion|serum|lipstick|eyeliner|perfume|cologne|toothpaste|skincare|sunscreen)\b/i,/\b(?:grocery|snack|chocolate|coffee|tea|supplement|protein|vitamin|pet\s*food)\b/i,/\b(?:book|novel|ebook|magazine|comic|stationery|pen|pencil|notebook)\b/i,/\b(?:drill|hammer|wrench|screw|hardware|car\s*part|tire|motor\s*oil)\b/i,/\b(?:toy|lego|board\s*game|doll|action\s*figure|puzzle)\b/i],We=[{category:"full_body",type:"Saree",pattern:/\b(?:saree|sari|kanjivaram|banarasi|chanderi)\b/i},{category:"full_body",type:"Lehenga",pattern:/\b(?:lehenga|ghagra|chaniya\s*choli)\b/i},{category:"full_body",type:"Anarkali Suit",pattern:/\b(?:anarkali|angrakha)\b/i},{category:"full_body",type:"Salwar Suit",pattern:/\b(?:salwar\s*(?:suit|kameez)|churidar\s*suit|patiala\s*suit)\b/i},{category:"full_body",type:"Sherwani",pattern:/\b(?:sherwani|achkan|indo[- ]?western\s*suit)\b/i},{category:"full_body",type:"Ethnic Set",pattern:/\b(?:ethnic\s*set|kurta\s*set|kurta\s*pajama)\b/i},{category:"full_body",type:"Co-ord Set",pattern:/\b(?:co[- ]?ord|coord\s*set|two[- ]?piece\s*set)\b/i},{category:"full_body",type:"Dress",pattern:/\b(?:dress|gown|maxi\s*dress|midi\s*dress|mini\s*dress|sundress|frock|slip\s*dress)\b/i},{category:"full_body",type:"Jumpsuit",pattern:/\b(?:jumpsuit|romper|dungaree|playsuit)\b/i},{category:"full_body",type:"Tracksuit",pattern:/\b(?:tracksuit|sweatsuit)\b/i},{category:"full_body",type:"Kaftan",pattern:/\b(?:kaftan|caftan)\b/i},{category:"upper_body",type:"Kurta",pattern:/\b(?:kurta|kurti|tunic)\b/i},{category:"upper_body",type:"Nehru Jacket",pattern:/\b(?:nehru\s*jacket|bundi|bandhgala(?:[- ]?jacket)?|jodhpuri(?:[- ]?suit)?|waistcoat)\b/i},{category:"upper_body",type:"T-Shirt",pattern:/\b(?:t[-\s]?shirt|tee|graphic\s*tee|crewneck|v[- ]?neck)\b/i},{category:"upper_body",type:"Polo",pattern:/\b(?:polo\s*shirt|polo\s*tee|polo)\b/i},{category:"upper_body",type:"Shirt",pattern:/\b(?:casual\s*shirt|formal\s*shirt|linen\s*shirt|overshirt|button[- ]?down|flannel)\b/i},{category:"upper_body",type:"Hoodie",pattern:/\b(?:hoodie|hooded\s*sweatshirt|pullover\s*hoodie)\b/i},{category:"upper_body",type:"Sweatshirt",pattern:/\b(?:sweatshirt|fleece\s*crew)\b/i},{category:"upper_body",type:"Jacket",pattern:/\b(?:denim\s*jacket|bomber\s*jacket|puffer|windbreaker|biker\s*jacket|varsity|leather\s*jacket)\b/i},{category:"upper_body",type:"Blazer",pattern:/\b(?:blazer|suit\s*jacket|sport\s*coat)\b/i},{category:"upper_body",type:"Coat",pattern:/\b(?:overcoat|trench\s*coat|parka|peacoat)\b/i},{category:"upper_body",type:"Top",pattern:/\b(?:crop\s*top|tank\s*top|camisole|halter\s*top|blouse|corset|tube\s*top)\b/i},{category:"upper_body",type:"Sweater",pattern:/\b(?:sweater|cardigan|pullover|knitwear|jumper)\b/i},{category:"upper_body",type:"Vest",pattern:/\b(?:gilet|vest|puffer\s*vest)\b/i},{category:"lower_body",type:"Jeans",pattern:/\b(?:jeans|denim\s*pants|skinny\s*jeans|baggy\s*jeans|flare\s*jeans|straight\s*fit\s*jeans)\b/i},{category:"lower_body",type:"Trousers",pattern:/\b(?:trousers|chinos|formal\s*pants|khakis|slacks)\b/i},{category:"lower_body",type:"Shorts",pattern:/\b(?:shorts|bermuda|cargo\s*shorts|denim\s*shorts|boardshorts)\b/i},{category:"lower_body",type:"Skirt",pattern:/\b(?:skirt|mini\s*skirt|midi\s*skirt|pleated\s*skirt|pencil\s*skirt)\b/i},{category:"lower_body",type:"Joggers",pattern:/\b(?:joggers|sweatpants|track\s*pants|lounge\s*pants)\b/i},{category:"lower_body",type:"Leggings",pattern:/\b(?:leggings|tights|yoga\s*pants)\b/i},{category:"lower_body",type:"Ethnic Bottoms",pattern:/\b(?:palazzo|dhoti|salwar|churidar|sharara|gharara)\b/i},{category:"lower_body",type:"Cargos",pattern:/\b(?:cargo\s*pants|cargos|combat\s*pants)\b/i},{category:"shoes",type:"Sneakers",pattern:/\b(?:sneakers|trainers|running\s*shoes|kicks|tennis\s*shoes)\b/i},{category:"shoes",type:"Boots",pattern:/\b(?:boots|chelsea\s*boots|ankle\s*boots|combat\s*boots)\b/i},{category:"shoes",type:"Loafers",pattern:/\b(?:loafers|moccasins|boat\s*shoes)\b/i},{category:"shoes",type:"Heels",pattern:/\b(?:heels|stilettos|pumps|wedges)\b/i},{category:"shoes",type:"Sandals",pattern:/\b(?:sandals|slides|flip[- ]?flops|slippers|clogs|crocs)\b/i},{category:"shoes",type:"Ethnic Footwear",pattern:/\b(?:juttis|mojaris|kolhapuris)\b/i},{category:"eyewear",type:"Sunglasses",pattern:/\b(?:sunglasses|shades|eyewear|spectacles|glasses|aviators?|wayfarers?)\b/i},{category:"headwear",type:"Hat",pattern:/\b(?:cap|baseball\s*cap|hat|beanie|bucket\s*hat|fedora|beret|snapback)\b/i},{category:"earrings",type:"Earrings",pattern:/\b(?:earrings?|ear\s*studs?|hoops?|jhumkas?|drop\s*earrings?)\b/i},{category:"necklace",type:"Necklace",pattern:/\b(?:necklace|choker|chain|pendant|locket|collar\s*necklace)\b/i},{category:"wristwear",type:"Watch",pattern:/\b(?:watch|wrist\s*watch|chronograph|bracelet|bangle|wristband)\b/i},{category:"ring",type:"Ring",pattern:/\b(?:ring|finger\s*ring|band|signet\s*ring)\b/i},{category:"bag",type:"Bag",pattern:/\b(?:handbag|backpack|tote\s*bag|clutch|sling\s*bag|duffel|crossbody|satchel|shoulder\s*bag)\b/i},{category:"belt",type:"Belt",pattern:/\b(?:leather\s*belt|waist\s*belt|designer\s*belt|buckle\s*belt)\b/i},{category:"scarf",type:"Scarf",pattern:/\b(?:dupatta|stole|scarf|shawl|muffler)\b/i}];function U(e,t="",a="",n=[]){let o=`${e} ${t} ${a} ${n.join(" ")}`.toLowerCase();for(let r of Ge)if(r.test(o)&&!/\b(?:t-shirt|shirt|hoodie|jeans|dress|saree|kurta|jacket|blazer|top|pants|sneakers)\b/i.test(o))return{isFashion:!1,category:"other",garmentType:"Non-Apparel",confidence:.95};for(let r of We)if(r.pattern.test(o))return{isFashion:!0,category:r.category,garmentType:r.type,confidence:.94};return/\b(?:apparel|clothing|wear|outfit|garment|fashion|attire)\b/i.test(o)?{isFashion:!0,category:"upper_body",garmentType:"Apparel",confidence:.7}:{isFashion:!1,category:"unknown",garmentType:"Item",confidence:.4}}var Ee=[/\b(?:logo|brand[-_]?logo|site[-_]?logo)\b/i,/\b(?:banner|promo|hero[-_]?banner|slide[-_]?banner)\b/i,/\b(?:icon|favicon|cart[-_]?icon|search[-_]?icon|close[-_]?icon|arrow)\b/i,/\b(?:avatar|user[-_]?profile|author|testimonial)\b/i,/\b(?:payment|visa|mastercard|amex|rupay|upi|paypal|paytm)\b/i,/\b(?:badge|seal|guarantee|trustpilot|certified|ssl)\b/i,/\b(?:rating|star|review[-_]?star)\b/i,/\b(?:social|facebook|instagram|twitter|youtube|linkedin|tiktok)\b/i,/\b(?:sprite|pixel|spacer|blank\.gif|loading|placeholder)\b/i];function P(e){if(e.tagName==="IMG"){let o=e,c=o.getAttribute("data-a-dynamic-image");if(c)try{let l=JSON.parse(c),i=Object.keys(l);if(i.length>0)return i.sort((p,m)=>(l[m][0]||0)-(l[p][0]||0)),L(i[0])}catch{}let r=["data-zoom-image","data-old-hires","data-large-image","data-high-res-src","data-full-src","data-magnify-src","data-zoom","data-origin","data-original","data-src","data-lazy-src"];for(let l of r){let i=o.getAttribute(l);if(i&&/^https?:\/\//i.test(i))return L(i)}let s=o.closest("picture");if(s){let l=Array.from(s.querySelectorAll("source[srcset]"));for(let i of l){let p=i.getAttribute("srcset");if(p){let m=ke(p);if(m)return L(m)}}}let d=o.getAttribute("srcset");if(d){let l=ke(d);if(l)return L(l)}let g=o.currentSrc||o.src||"";return L(g)}let t=e.style.backgroundImage||window.getComputedStyle(e).backgroundImage;if(t&&t.startsWith("url(")){let o=t.match(/url\(['"]?(.*?)['"]?\)/i);if(o&&o[1])return L(o[1])}let a=e.querySelector("[style*='background-image'], .image-grid-image");if(a){let o=a.style?.backgroundImage||window.getComputedStyle(a).backgroundImage;if(o&&o.startsWith("url(")){let c=o.match(/url\(['"]?(.*?)['"]?\)/i);if(c&&c[1])return L(c[1])}}let n=e.querySelector("img");return n?P(n):""}function ke(e){let t=e.split(",").map(o=>o.trim());if(t.length===0)return null;let a=null,n=0;for(let o of t){let c=o.split(/\s+/),r=c[0],s=c[1]||"",d=1;s.endsWith("w")?d=parseInt(s.replace("w",""),10)||1:s.endsWith("x")&&(d=(parseFloat(s.replace("x",""))||1)*1e3),d>=n&&/^https?:\/\//i.test(r)&&(n=d,a=r)}return a||t[t.length-1]?.split(/\s+/)[0]||null}function L(e){return e?(e.includes("/image/upload/")&&(e=e.replace(/\/image\/upload\/(?:[a-zA-Z0-9_,]+)\//,"/image/upload/q_auto:best,f_auto,w_1440/")),e.includes("cdn.shopify.com")&&(e=e.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|\d+x\d+)\.(jpg|jpeg|png|webp)/i,"_master.$1"),e=e.replace(/[?&]width=\d+/,"?width=1440")),/[?&](?:w|width)=\d+/i.test(e)&&(e=e.replace(/([?&](?:w|width)=)\d+/i,"$11440")),/[?&]quality=\d+/i.test(e)&&(e=e.replace(/([?&]quality=)\d+/i,"$195")),/[?&]wid=\d+/i.test(e)&&(e=e.replace(/([?&]wid=)\d+/i,"$11600")),e.includes("assets.myntassets.com")?e=e.replace(/\/f_webp,[^/]+\//,"/h_1440,q_95,w_1080/").replace(/\/h_\d+,q_\d+,w_\d+\//,"/h_1440,q_95,w_1080/").replace(/\/w_\d+,c_limit,fl_progressive\//,"/h_1440,q_95,w_1080/"):e.includes("flixcart.com/image/")?e=e.replace(/\/image\/\d+\/\d+\//,"/image/832/832/"):e.includes("media-amazon.com")||e.includes("images-amazon.com")?e=e.replace(/\._[A-Z0-9_,]+_\./,"._AC_SL1500_."):e.includes("static.zara.net")||e.includes("itxweb.com")?e=e.replace(/\/w\/\d+\//,"/w/1024/"):e.includes("ltwebstatic.com")?e=e.replace(/_thumbnail_\d+x\d+/,"").replace(/_\d+x\d+\.jpg/,".jpg"):e.includes("asos-media.com")?e=e.replace(/\?\$[^$]+\$/,"?$n_960w$"):e.includes("images.meesho.com")&&(e=e.replace(/\/(?:256|512)\//,"/1024/")),e):""}function T(e){let t=e.getBoundingClientRect(),a=t.width||e.offsetWidth||e.naturalWidth||e.width||0,n=t.height||e.offsetHeight||e.parentElement?.offsetHeight||0||e.naturalHeight||e.height||0;if(a<180||n<180)return!1;let o=n/a;if(o<.65||o>2.8)return!1;let c=P(e);if(!c||c.startsWith("data:image/svg")||c.endsWith(".svg"))return!1;for(let i of Ee)if(i.test(c))return!1;let r=e.getAttribute("alt")||"",s=e.getAttribute("title")||"",d=String(e.className||""),g=e.id||"",l=`${r} ${s} ${d} ${g}`.toLowerCase();for(let i of Ee)if(i.test(l))return!1;return!e.closest("header, footer, nav, [role='banner'], [role='navigation']")}var Se=["XXS","XS","S","M","L","XL","XXL","2XL","3XL","4XL"],Le=["28","30","32","34","36","38","39","40","42","44","46","48"];function ie(e=document){let t=new Set,a=new Set,n=Array.from(e.querySelectorAll("button, [role='radio'], [data-size], [data-attr-value], .size-buttons-size-button, .size-pill, .size-option, [class*='size-item'], [class*='size-btn'], [class*='SizeButton']"));for(let s of n){let d=(s.textContent||s.getAttribute("data-size")||s.getAttribute("data-attr-value")||"").trim().toUpperCase();if(!d)continue;let g=null,l=d.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL)\b/);if(l&&(g=l[1]),!g){let i=d.match(/\b(28|30|32|34|36|38|39|40|42|44|46|48)\b/);i&&(g=i[1])}g&&(s.hasAttribute("disabled")||s.getAttribute("aria-disabled")==="true"||/\b(?:disabled|out[-_]?of[-_]?stock|sold[-_]?out|unavailable|strikethrough)\b/i.test(s.className)?a.add(g):t.add(g))}if(t.size===0){let s=e.querySelector("select[name*='size' i], select[id*='size' i]");if(s)for(let d of Array.from(s.options)){let g=d.text.trim().toUpperCase();for(let l of[...Se,...Le])g.includes(l)&&(d.disabled||g.includes("OUT OF STOCK")||g.includes("SOLD OUT")?a.add(l):t.add(l))}}if(t.size===0)return{available:["XS","S","M","L","XL","XXL"],outOfStock:[],source:"default"};let o=[...Se,...Le],c=o.filter(s=>t.has(s)),r=o.filter(s=>a.has(s));return{available:c,outOfStock:r,source:"dom-pills"}}function ce(e=document,t=location){let a=se(e,t),n="",o="",c="",r="",s="";if(a.rawJsonLd){let l=a.rawJsonLd;if(n=String(l.name||""),l.brand&&(o=typeof l.brand=="string"?l.brand:String(l.brand.name||"")),l.image){let i=Array.isArray(l.image)?l.image[0]:l.image;s=typeof i=="string"?i:String(i?.url||"")}if(l.offers){let i=Array.isArray(l.offers)?l.offers[0]:l.offers;i&&(c=String(i.price||i.lowPrice||""),r=String(i.priceCurrency||""))}}n||(n=e.querySelector('meta[property="og:title"]')?.getAttribute("content")||e.querySelector("h1")?.textContent?.trim()||e.title.split(/[-|·]/)[0].trim()),o||(o=e.querySelector('meta[property="og:site_name"]')?.getAttribute("content")||t.hostname.replace("www.","").split(".")[0].toUpperCase());let d=U(n,"",t.pathname);if(!s){let l=e.querySelector('meta[property="og:image"]')?.getAttribute("content");l&&!l.includes("logo")&&!l.includes("favicon")&&(s=L(l))}if(!s){let i=Array.from(e.querySelectorAll("img, [style*='background-image']")).filter(T);i.length>0&&(s=P(i[0]))}if(!s)return null;let g=ie(e);return{id:`prod_${Date.now()}`,name:n,brand:o,price:c?`${r} ${c}`.trim():void 0,currency:r||void 0,imageUrl:s,productUrl:t.href,pageUrl:t.href,category:d.garmentType,isFashion:d.isFashion,availableSizes:g.available,outOfStockSizes:g.outOfStock,confidence:a.confidence,detectionSource:a.rawJsonLd?"json-ld":"dom-heuristic"}}function J(e){if(e.tagName==="IMG"){let o=e,c=o.getAttribute("data-a-dynamic-image");if(c)try{let l=JSON.parse(c),i=Object.keys(l);if(i.length>0)return i.sort((p,m)=>(l[m][0]||0)-(l[p][0]||0)),i[0]}catch{}let r=o.getAttribute("data-old-hires")||o.getAttribute("data-zoom-image")||o.getAttribute("data-large-image")||o.getAttribute("data-high-res-src")||o.getAttribute("data-full-src");if(r&&/^https?:\/\//i.test(r))return r;let s=o.closest("picture");if(s){let l=Array.from(s.querySelectorAll("source[srcset]"));for(let i of l){let p=i.getAttribute("srcset");if(p){let m=p.split(",").map(b=>b.trim().split(" ")[0]),u=m[m.length-1];if(u&&/^https?:\/\//i.test(u))return u}}}let d=o.getAttribute("srcset");if(d){let l=d.split(",").map(p=>p.trim().split(" ")[0]),i=l[l.length-1];if(i&&/^https?:\/\//i.test(i))return i}let g=o.getAttribute("data-src")||o.getAttribute("data-original")||o.getAttribute("data-lazy-src")||o.currentSrc||o.src||"";return le(g)}let t=e.style.backgroundImage||window.getComputedStyle(e).backgroundImage;if(t&&t.startsWith("url(")){let o=t.match(/url\(['"]?(.*?)['"]?\)/i);if(o&&o[1])return le(o[1])}let a=e.querySelector("[style*='background-image'], .image-grid-image");if(a){let o=a.style?.backgroundImage||window.getComputedStyle(a).backgroundImage;if(o&&o.startsWith("url(")){let c=o.match(/url\(['"]?(.*?)['"]?\)/i);if(c&&c[1])return le(c[1])}}let n=e.querySelector("img");return n?J(n):""}function le(e){return e?e.includes("assets.myntassets.com")?e.replace(/\/f_webp,[^/]+\//,"/h_1440,q_95,w_1080/").replace(/\/h_\d+,q_\d+,w_\d+\//,"/h_1440,q_95,w_1080/").replace(/\/w_\d+,c_limit,fl_progressive\//,"/h_1440,q_95,w_1080/"):e.includes("flixcart.com/image/")?e.replace(/\/image\/\d+\/\d+\//,"/image/832/832/"):e.includes("media-amazon.com")||e.includes("images-amazon.com")?e.replace(/\._[A-Z0-9_,]+_\./,"._AC_SL1500_."):e.includes("static.zara.net")||e.includes("itxweb.com")?e.replace(/\/w\/\d+\//,"/w/1024/"):e.includes("ltwebstatic.com")?e.replace(/_thumbnail_\d+x\d+/,"").replace(/_\d+x\d+\.jpg/,".jpg"):e.includes("asos-media.com")?e.replace(/\?\$[^$]+\$/,"?$n_960w$"):e.includes("cdn.shopify.com")?e.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|\d+x\d+)\.(jpg|jpeg|png|webp)/i,"_master.$1"):e.includes("images.meesho.com")?e.replace(/\/(?:256|512)\//,"/1024/"):e.includes("assets.ajio.com")?e.replace(/\?.*$/,""):e.includes("nike.com")||e.includes("adidas.com")?e.replace(/[?&]wid=\d+/,"?wid=1400"):e:""}function $(e,t){let a="",n="",o="",c="";try{let d=document.querySelectorAll('script[type="application/ld+json"]');for(let g of Array.from(d)){let l=JSON.parse(g.textContent||"{}"),i=l["@type"]==="Product"?l:Array.isArray(l["@graph"])?l["@graph"].find(p=>p["@type"]==="Product"):null;if(i&&i.name){if(a=String(i.name),i.brand&&(n=typeof i.brand=="string"?i.brand:String(i.brand.name||"")),i.offers){let p=Array.isArray(i.offers)?i.offers[0]:i.offers;p&&(o=String(p.price||p.lowPrice||""),c=String(p.priceCurrency||""))}break}}}catch{}if(!a){let d=document.querySelector('meta[property="og:title"]')?.getAttribute("content"),l=(e.closest(".product-base, .item, [data-testid*='product'], article, .pdp-details, .product-card, .product-detail, [class*='ProductCard'], .product-item")||e.parentElement)?.querySelector("h1, h2, h3, .product-title, .product-name, [class*='title'], [class*='Title']"),i=e.getAttribute("alt")||"";a=l?.textContent?.trim()||d||i||document.title.split(/[-|·]/)[0].trim()}n||(n=document.querySelector('meta[property="og:site_name"]')?.getAttribute("content")||location.hostname.replace("www.","").split(".")[0].toUpperCase());let r=U(a,"",location.pathname),s=ie(document);return{id:`prod_${Date.now()}`,name:a,brand:n,price:o?`${c} ${o}`.trim():void 0,currency:c||void 0,imageUrl:t,productUrl:location.href,pageUrl:location.href,category:r.garmentType,isFashion:r.isFashion,availableSizes:s.available,outOfStockSizes:s.outOfStock,confidence:r.confidence,detectionSource:"dom-heuristic"}}var Te=new WeakSet;function q(e,t){if(Te.has(e))return;Te.add(e);let a=e.parentElement;if(!a)return;window.getComputedStyle(a).position==="static"&&(a.style.position="relative"),e.draggable=!0,a.draggable=!0;try{e.style.webkitUserDrag="element",a.style.webkitUserDrag="element"}catch{}let o=r=>{if(r.dataTransfer){let s=J(e);s&&(r.dataTransfer.setData("text/uri-list",s),r.dataTransfer.setData("text/plain",s))}};if(e.addEventListener("dragstart",o),a.addEventListener("dragstart",o),a.querySelector(".vestora-tryon-btn"))return;let c=document.createElement("button");c.type="button",c.className="vestora-tryon-btn",c.setAttribute("aria-label","Try with VESTORA"),c.innerHTML='<span class="vestora-btn-sparkle">\u2726</span> Try with VESTORA',c.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),r.stopImmediatePropagation();let s=J(e),d=$(e,s);c.classList.add("is-active"),setTimeout(()=>c.classList.remove("is-active"),1200),t(d)}),c.addEventListener("touchstart",r=>{r.stopPropagation()},{passive:!0}),a.appendChild(c)}var de=null;function Ie(e,t){if(de||document.getElementById("vestora-corner-badge")||!e||!e.imageUrl||!e.isFashion)return;let a=document.createElement("div");a.id="vestora-corner-badge",a.className="vestora-corner-badge",a.setAttribute("role","button"),a.setAttribute("aria-label","VESTORA Virtual Try-On Detected Item");let n=e.brand||"Fashion Store",o=e.name||"Clothing Item",c=e.category||"Apparel";a.innerHTML=`
    <img src="${e.imageUrl}" alt="${o}" class="vestora-badge-thumb" />
    <div class="vestora-badge-info">
      <div class="vestora-badge-title-row">
        <span class="vestora-badge-tag">${c}</span>
      </div>
      <span class="vestora-badge-name" title="${o}">${o}</span>
    </div>
    <button class="vestora-badge-cta" type="button">
      <span>\u2726 Try On</span>
    </button>
    <button class="vestora-badge-close" type="button" aria-label="Dismiss">\u2715</button>
  `,a.addEventListener("click",r=>{if(r.target.closest(".vestora-badge-close")){r.stopPropagation(),a.remove(),de=null;return}t(e)}),document.body.appendChild(a),de=a}var _e=null;function Ae(e){if(_e||document.getElementById("vestora-floating-dock"))return;let t=document.createElement("div");t.id="vestora-floating-dock",t.className="vestora-floating-dock",t.setAttribute("role","button"),t.setAttribute("aria-label","Open VESTORA Live Virtual Try-On"),t.title="VESTORA \u2014 Live AI Virtual Try-On",t.innerHTML=`
    <div class="vestora-dock-handle">
      <span class="vestora-dock-sparkle">\u2726</span>
      <span class="vestora-dock-text">VESTORA</span>
      <span class="vestora-dock-sub">Try-On</span>
    </div>
  `,t.addEventListener("click",a=>{a.preventDefault(),a.stopPropagation(),e()}),document.body.appendChild(t),_e=t}var Me=new WeakSet;function Ce(e=location){let t=e.hostname.toLowerCase(),a=e.pathname.toLowerCase(),n=e.search.toLowerCase();return t.includes("google.")?!!(t.startsWith("images.google.")||n.includes("tbm=isch")||n.includes("udm=2")||a.startsWith("/imghp")||a.startsWith("/images")||(a==="/search"||a==="/"||a==="/webhp")&&typeof document<"u"&&!!document.querySelector("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], #islrg, #islsp, div[jsname='r5xlne'], div.isv-r, img.YQ4gaf, img.rg_i")):!1}function K(e){let t=e.tagName==="A"?e:e.closest("a[href*='imgurl='], a[href*='/imgres']");if(t&&t.href){try{let c=new URL(t.href,location.origin).searchParams.get("imgurl");if(c&&/^https?:\/\//i.test(c))return c}catch{}let n=t.href.match(/[?&]imgurl=([^&]+)/i);if(n&&n[1])try{let o=decodeURIComponent(n[1]);if(/^https?:\/\//i.test(o))return o}catch{}}let a=e.tagName==="IMG"?e:e.querySelector("img");if(a){let n=a.getAttribute("data-src")||a.getAttribute("data-deferred")||a.currentSrc||a.src||"";if(n.startsWith("data:")||n.length<50){let o=a.closest("#islsp, div[jsname='figiqf'], div.v6bBac, div[data-ri]");if(o){let c=o.querySelector("img[src^='http']:not([src*='google.com/favicon'])");if(c&&c.src&&!c.src.includes("encrypted-tbn"))return c.src}}if(n&&/^https?:\/\//i.test(n))return n}return""}function Xe(e,t){let a=e.closest("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], div.isv-r, div[jsname='dTDiAc'], #islsp, div[jsname='figiqf']")||e.parentElement,n="",o=a?.querySelector("h3, a[title], [data-lpage] h2, [data-lpage] h3, div.zbN8od, div.mNsIgd");if(o&&(n=o.textContent?.trim()||o.getAttribute("title")||""),!n&&e.tagName==="IMG"&&(n=e.getAttribute("alt")||""),!n&&a){let d=a.querySelector("img");d&&(n=d.getAttribute("alt")||"")}if(!n||n.length<3){let g=new URLSearchParams(location.search).get("q")||"";g?n=g.replace(/[+]/g," ").trim():n="Fashion Item"}let c="Web",r=a?.querySelector("div.NJbYFc, span.yNF4af, span.fA3vx, div.mNsIgd");r&&r.textContent&&(c=r.textContent.trim());let s=U(n,"",location.search);return{id:`gimg_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,name:n,brand:c,imageUrl:t,productUrl:location.href,pageUrl:location.href,category:s.garmentType,garmentCategory:s.category,isFashion:!0,availableSizes:["XS","S","M","L","XL","XXL"],confidence:s.confidence||.92,detectionSource:"dom-heuristic"}}function pe(e,t,a,n){if(Me.has(e)||e.querySelector(".vestora-tryon-btn, .vestora-google-tryon-pill"))return;Me.add(e),window.getComputedStyle(e).position==="static"&&(e.style.position="relative");let c=document.createElement("button");c.type="button",c.className="vestora-tryon-btn vestora-google-tryon-pill",c.setAttribute("aria-label","Try with VESTORA"),c.innerHTML='<span class="vestora-btn-sparkle">\u2726</span> Try with VESTORA',c.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),r.stopImmediatePropagation();let d=Xe(n||e,t);c.classList.add("is-active"),setTimeout(()=>c.classList.remove("is-active"),1200),a(d)}),c.addEventListener("touchstart",r=>{r.stopPropagation()},{passive:!0}),e.appendChild(c)}function He(e){function t(){Array.from(document.querySelectorAll("#islsp img.n3VNCb, #islsp img.sFlh5c, #islsp img.pT0Scc, div.v6bBac img, img[jsname='HiaYvf'], div[jsname='figiqf'] img")).forEach(r=>{let s=K(r)||r.currentSrc||r.src;if(s&&!s.startsWith("data:image/svg")&&s.length>20){let d=r.closest("#islsp, div[jsname='figiqf'], div.v6bBac")||r.parentElement;d&&pe(d,s,e,r)}}),Array.from(document.querySelectorAll("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], div.isv-r, div.eA0Zlc, div.foyFie, div.mNsIgd")).forEach(r=>{let s=r.querySelector("img")||(r.tagName==="IMG"?r:null);if(!s)return;let d=K(r)||K(s)||s.currentSrc||s.src;d&&!d.startsWith("data:image/svg")&&d.length>20&&pe(r,d,e,s)}),Array.from(document.querySelectorAll("img.YQ4gaf, img.rg_i, img.Q4LuSd")).forEach(r=>{let s=r.closest("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], div.isv-r")||r.parentElement;if(!s)return;let d=K(r)||r.currentSrc||r.src;d&&!d.startsWith("data:image/svg")&&d.length>20&&pe(s,d,e,r)})}t(),new MutationObserver(()=>{t()}).observe(document.body,{childList:!0,subtree:!0}),setInterval(t,1200)}var ze="vestora-panel-host";var Ve={NOSE:0,LEFT_EYE:1,RIGHT_EYE:2,LEFT_EAR:3,RIGHT_EAR:4,LEFT_SHOULDER:5,RIGHT_SHOULDER:6,LEFT_ELBOW:7,RIGHT_ELBOW:8,LEFT_WRIST:9,RIGHT_WRIST:10,LEFT_HIP:11,RIGHT_HIP:12,LEFT_KNEE:13,RIGHT_KNEE:14,LEFT_ANKLE:15,RIGHT_ANKLE:16,HEAD_CROWN:17,NECK:18},Ye={XS:{shoulder:[36,39],chest:[81,87],waist:[66,72]},S:{shoulder:[39,42],chest:[87,93],waist:[72,78]},M:{shoulder:[42,45],chest:[93,99],waist:[78,84]},L:{shoulder:[45,48],chest:[99,107],waist:[84,92]},XL:{shoulder:[48,52],chest:[107,115],waist:[92,100]},XXL:{shoulder:[52,56],chest:[115,124],waist:[100,110]}},Pe=[{name:"Oversized Minimalist Jacket",category:"Jacket",garmentCategory:"upper_body",imageUrl:"https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",availableSizes:["S","M","L","XL"]},{name:"Streetwear Graphic Hoodie",category:"Hoodie",garmentCategory:"upper_body",imageUrl:"https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",availableSizes:["M","L","XL","XXL"]},{name:"Classic Aviator Sunglasses",category:"Sunglasses",garmentCategory:"eyewear",imageUrl:"https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80",availableSizes:["One Size"]},{name:"Urban Snapback Cap",category:"Hat",garmentCategory:"headwear",imageUrl:"https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80",availableSizes:["One Size"]}],Oe=0,S=null,h=null,I=null,H=null,x=[],ae=.88,_=1,Z=0,z="user",W=!1,ge=!1,y=null,w=null,f=null,G=null,me=null,be=null,R=null,j=null,fe=null,he=null,ve=null,ye=null,xe=null,re=null,B=null,Be=null,C=null,Q=null,ee=null,Je=`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* \u2500\u2500 Panel Shell \u2500\u2500 */
  .v-panel {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 420px;
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
`;function Ke(){return`
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
  `}function X(e){if(S&&h){oe(e,!1),k(`\u2726 Added ${e.name.slice(0,28)}\u2026`);return}Ze(e)}function Ne(e){if(!S||!h){X(e);return}oe(e,!1),k(`\u2726 Added ${e.name.slice(0,28)}\u2026`)}function Ze(e){document.getElementById(ze)?.remove(),ne(),S=document.createElement("div"),S.id=ze,S.style.cssText="position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483646!important;",document.documentElement.appendChild(S),h=S.attachShadow({mode:"open"});let t=document.createElement("style");t.textContent=Je,h.appendChild(t);let a=document.createElement("div");a.innerHTML=Ke(),h.appendChild(a);let n=h.getElementById("v-panel");n.style.pointerEvents="all";let o=h.getElementById("v-toggle-tab");o.style.pointerEvents="all",y=h.getElementById("v-video"),w=h.getElementById("v-canvas"),G=h.getElementById("v-camera-blocked"),me=h.getElementById("v-product-name"),be=h.getElementById("v-product-cat"),R=h.getElementById("v-product-thumb"),j=h.getElementById("v-outfit-list"),fe=h.getElementById("v-outfit-count"),he=h.getElementById("v-meas-shoulder"),ve=h.getElementById("v-meas-chest"),ye=h.getElementById("v-meas-waist"),xe=h.getElementById("v-meas-torso"),re=h.getElementById("v-rec-size"),B=h.getElementById("v-sizes-row"),Be=h.getElementById("v-fit-panel"),C=h.getElementById("v-fit-scale-val"),Q=h.getElementById("v-opacity-slider"),ee=h.getElementById("v-toast"),f=w.getContext("2d",{desynchronized:!0,alpha:!0}),requestAnimationFrame(()=>requestAnimationFrame(()=>{n.classList.add("is-open"),o.classList.remove("hidden")})),Qe(),e&&oe(e,!0),D("user")}function Qe(){let e=h,t=e.getElementById("v-panel"),a=e.getElementById("v-toggle-tab");e.getElementById("v-btn-close").addEventListener("click",Re),a.addEventListener("click",()=>{t.classList.add("is-open"),a.classList.add("hidden"),I||D(z)}),e.getElementById("v-btn-flip").addEventListener("click",()=>{D(z==="user"?"environment":"user")}),e.getElementById("v-btn-fit").addEventListener("click",()=>{ge=!ge,Be.classList.toggle("open",ge)}),e.getElementById("v-btn-screenshot").addEventListener("click",yt),e.getElementById("v-btn-retry-cam").addEventListener("click",()=>{G.classList.add("hidden"),D(z)}),e.getElementById("v-btn-use-photo").addEventListener("click",()=>{e.getElementById("v-photo-input").click()}),e.getElementById("v-photo-input").addEventListener("change",n=>{let o=n.target.files?.[0];if(!o)return;let c=new FileReader;c.onload=r=>{let s=new Image;s.onload=()=>{ne(),w&&(w.width=s.naturalWidth,w.height=s.naturalHeight),G.classList.add("hidden"),y&&(y.style.display="none"),W=!0,k("\u2726 Photo loaded \u2014 try-on active!"),Fe()},s.src=r.target.result},c.readAsDataURL(o)}),e.getElementById("v-btn-grab").addEventListener("click",()=>{k("Hover any clothing image \u2192 click \u2726 Try with VESTORA")}),e.getElementById("v-btn-sample").addEventListener("click",et),e.getElementById("v-btn-add").addEventListener("click",()=>{k("Hover any clothing image \u2192 click \u2726 Try with VESTORA")}),e.getElementById("v-btn-clear").addEventListener("click",()=>{x=[],F(),k("Cleared all items")}),e.getElementById("v-fit-scale-down").addEventListener("click",()=>{_=Math.max(.5,_-.05),O(),C&&(C.textContent=`${Math.round(_*100)}%`)}),e.getElementById("v-fit-scale-up").addEventListener("click",()=>{_=Math.min(2.5,_+.05),O(),C&&(C.textContent=`${Math.round(_*100)}%`)}),e.getElementById("v-fit-up").addEventListener("click",()=>{Z-=10,O()}),e.getElementById("v-fit-down").addEventListener("click",()=>{Z+=10,O()}),e.getElementById("v-fit-reset").addEventListener("click",()=>{_=1,Z=0,ae=.88,C&&(C.textContent="100%"),Q&&(Q.value="88"),O()}),Q.addEventListener("input",n=>{ae=parseInt(n.target.value)/100,O()}),e.getElementById("v-btn-camera").addEventListener("click",()=>{e.getElementById("v-btn-camera").classList.add("active"),e.getElementById("v-btn-photo").classList.remove("active"),y&&(y.style.display="block"),I||D(z)}),e.getElementById("v-btn-photo").addEventListener("click",()=>{e.getElementById("v-btn-photo").classList.add("active"),e.getElementById("v-btn-camera").classList.remove("active"),e.getElementById("v-photo-input").click()}),document.addEventListener("keydown",n=>{n.key==="Escape"&&S&&Re()})}function O(){x.filter(e=>e.enabled).forEach(e=>{e.scale=_,e.offsetY=Z,e.opacity=ae})}function et(){let e=Pe[Oe%Pe.length];Oe++,oe({id:`sample_${Date.now()}`,name:e.name,category:e.category,brand:"VESTORA Sample",imageUrl:e.imageUrl,productUrl:"",pageUrl:"",isFashion:!0,availableSizes:e.availableSizes,outOfStockSizes:[],confidence:1,detectionSource:"dom-heuristic",garmentCategory:e.garmentCategory},!1)}function Re(){let e=h?.getElementById("v-panel"),t=h?.getElementById("v-toggle-tab");e&&(e.classList.remove("is-open"),t?.classList.add("hidden"),setTimeout(()=>{ne(),S?.remove(),S=null,h=null,x=[],W=!1},420))}async function D(e){ne(),G?.classList.add("hidden"),we(!0,"Starting camera\u2026");let t=[{video:{facingMode:{ideal:e},width:{ideal:1280},height:{ideal:720}},audio:!1},{video:{facingMode:{ideal:e}},audio:!1},{video:!0,audio:!1}];for(let a of t)try{I=await navigator.mediaDevices.getUserMedia(a),await tt(I,e);return}catch{}at()}async function tt(e,t){y&&(z=t,y.srcObject=e,y.style.transform=t==="user"?"scaleX(-1)":"",y.style.display="block",await new Promise(a=>{y.onloadedmetadata=()=>y.play().then(a).catch(a)}),rt(),setTimeout(()=>{W=!0,we(!1,"Body Detected \u2713"),k("\u2726 Camera active \u2014 live try-on ready!"),Fe()},1100))}function ne(){H&&(cancelAnimationFrame(H),H=null),I&&(I.getTracks().forEach(e=>e.stop()),I=null),W=!1}function at(){we(!0,"No Camera");let e=h?.getElementById("v-camera-error-msg");e&&(e.textContent="Camera permission was denied or no camera found. Click \u21BA Retry after allowing camera in browser settings, or use Photo mode."),G?.classList.remove("hidden")}function we(e,t){let a=h?.getElementById("v-detect-ring");if(!a)return;a.classList.toggle("detecting",e);let n=a.querySelector("span");n&&(n.textContent=t)}function rt(){!y||!w||(w.width=y.videoWidth||640,w.height=y.videoHeight||480)}function Fe(){H&&cancelAnimationFrame(H);function e(){if(H=requestAnimationFrame(e),!f||!w||!W)return;let t=w.width,a=w.height;if(!t||!a)return;let n=nt(t,a);bt(n,t,a),f.clearRect(0,0,t,a),ot(n,t,a,z==="user"&&!!I)}H=requestAnimationFrame(e)}function nt(e,t){let a=t*.15,n=t*.18,o=t*.08,c=t*.25,r=t*.31,s=t*.49,d=t*.62,g=t*.64,l=t*.82,i=t*.96;return{landmarks:[{x:e*.5,y:n},{x:e*.46,y:a},{x:e*.54,y:a},{x:e*.4,y:n},{x:e*.6,y:n},{x:e*.37,y:r},{x:e*.63,y:r},{x:e*.29,y:s},{x:e*.71,y:s},{x:e*.24,y:d},{x:e*.76,y:d},{x:e*.4,y:g},{x:e*.6,y:g},{x:e*.41,y:l},{x:e*.59,y:l},{x:e*.42,y:i},{x:e*.58,y:i},{x:e*.5,y:o},{x:e*.5,y:c}]}}function ot(e,t,a,n){let o=["lower_body","full_body","upper_body","belt","necklace","scarf","bag","wristwear","ring","earrings","eyewear","headwear"],c=x.filter(r=>r.enabled).sort((r,s)=>o.indexOf(r.garmentCategory)-o.indexOf(s.garmentCategory));for(let r of c){let s=r.processedCanvas||r.imageElement;if(s)switch(r.garmentCategory){case"eyewear":lt(e.landmarks,t,a,r,s,n);break;case"headwear":dt(e.landmarks,t,a,r,s,n);break;case"necklace":pt(e.landmarks,t,a,r,s,n);break;case"wristwear":gt(e.landmarks,t,a,r,s,n);break;case"lower_body":it(e.landmarks,t,a,r,s,n);break;case"full_body":ct(e.landmarks,t,a,r,s,n);break;default:st(e.landmarks,t,a,r,s,n);break}}}var N=Ve;function st(e,t,a,n,o,c){let r=e[N.LEFT_SHOULDER],s=e[N.RIGHT_SHOULDER],d=e[N.LEFT_HIP];if(!r||!s||!d)return;let g=Math.abs(s.x-r.x),l=Math.abs(d.y-r.y),i=g*2.2*n.scale,p=l*1.45*n.scale,m=(r.x+s.x)/2,u=r.y-p*.08+n.offsetY,b=c?t-m-i/2:m-i/2,v=Math.atan2(s.y-r.y,s.x-r.x);f.save(),f.globalAlpha=n.opacity,f.translate(b+i/2,u+p/2),f.rotate(c?-v:v),f.translate(-(b+i/2),-(u+p/2)),f.drawImage(o,b,u,i,p),f.restore()}function it(e,t,a,n,o,c){let r=e[N.LEFT_HIP],s=e[N.RIGHT_HIP],d=e[N.LEFT_ANKLE];if(!r||!s||!d)return;let g=Math.abs(s.x-r.x),l=Math.abs(d.y-r.y),i=g*1.8*n.scale,p=l*1.15*n.scale,m=(r.x+s.x)/2,u=r.y-p*.05+n.offsetY,b=c?t-m-i/2:m-i/2;f.save(),f.globalAlpha=n.opacity,f.drawImage(o,b,u,i,p),f.restore()}function ct(e,t,a,n,o,c){let r=e[5],s=e[6],d=e[15];if(!r||!s||!d)return;let g=Math.abs(s.x-r.x),l=Math.abs(d.y-r.y),i=g*2.3*n.scale,p=l*1.25*n.scale,m=(r.x+s.x)/2,u=r.y-p*.04+n.offsetY,b=c?t-m-i/2:m-i/2;f.save(),f.globalAlpha=n.opacity,f.drawImage(o,b,u,i,p),f.restore()}function lt(e,t,a,n,o,c){let r=e[1],s=e[2];if(!r||!s)return;let d=s.x-r.x,g=s.y-r.y,l=Math.sqrt(d*d+g*g),i=Math.atan2(g,d),p=l*2.35*n.scale,m=p*.44,u=(r.x+s.x)/2,b=(r.y+s.y)/2+n.offsetY,v=c?t-u-p/2:u-p/2;f.save(),f.globalAlpha=n.opacity,f.translate(v+p/2,b),f.rotate(c?-i:i),f.translate(-(v+p/2),-b),f.drawImage(o,v,b-m/2,p,m),f.restore()}function dt(e,t,a,n,o,c){let r=e[17],s=e[5],d=e[6];if(!r||!s||!d)return;let l=Math.abs(d.x-s.x)*.78*n.scale,i=l*.72,p=r.x,m=r.y-i*.38+n.offsetY,u=c?t-p-l/2:p-l/2;f.save(),f.globalAlpha=n.opacity,f.drawImage(o,u,m-i/2,l,i),f.restore()}function pt(e,t,a,n,o,c){let r=e[18],s=e[5],d=e[6];if(!r||!s||!d)return;let l=Math.abs(d.x-s.x)*.62*n.scale,i=l*.85,p=r.x,m=r.y+i*.15+n.offsetY,u=c?t-p-l/2:p-l/2;f.save(),f.globalAlpha=n.opacity,f.drawImage(o,u,m-i/2,l,i),f.restore()}function gt(e,t,a,n,o,c){let r=e[9],s=e[5],d=e[6];if(!r||!s||!d)return;let l=Math.abs(d.x-s.x)*.32*n.scale,i=l*1.05,p=r.x,m=r.y+n.offsetY,u=c?t-p-l/2:p-l/2;f.save(),f.globalAlpha=n.opacity,f.drawImage(o,u,m-i/2,l,i),f.restore()}function ut(e){try{let t=e.naturalWidth,a=e.naturalHeight;if(!t||!a)return null;let n=document.createElement("canvas");n.width=t,n.height=a;let o=n.getContext("2d",{willReadFrequently:!0});o.drawImage(e,0,0);let c=o.getImageData(0,0,t,a),r=c.data,s=[0,(t-1)*4,(a-1)*t*4,(a*t-1)*4],d=0,g=0,l=0;if(s.forEach(i=>{d+=r[i],g+=r[i+1],l+=r[i+2]}),d/=4,g/=4,l/=4,d>210&&g>210&&l>210){for(let i=0;i<r.length;i+=4){let p=Math.sqrt((r[i]-d)**2+(r[i+1]-g)**2+(r[i+2]-l)**2);p<42&&(r[i+3]=Math.round(r[i+3]*Math.max(0,(p-14)/28)))}return o.putImageData(c,0,0),n}return null}catch{return null}}function mt(e="",t=""){let a=`${e} ${t}`.toLowerCase();return/sunglass|glasses|eyewear|aviator|shades|spectacle/i.test(a)?"eyewear":/\bcap\b|hat|beanie|snapback|fedora|visor/i.test(a)?"headwear":/necklace|chain|pendant|choker|collar/i.test(a)?"necklace":/earring|stud|jhumka|hoop/i.test(a)?"earrings":/watch|bracelet|bangle|wristband|kada/i.test(a)?"wristwear":/bag|handbag|backpack|tote|purse|clutch/i.test(a)?"bag":/belt|sash/i.test(a)?"belt":/pant|trouser|jean|skirt|shorts|legging/i.test(a)?"lower_body":/dress|gown|saree|sari|lehenga|jumpsuit|anarkali/i.test(a)?"full_body":"upper_body"}function Ue(e){return{eyewear:"Eyewear",headwear:"Hat",necklace:"Necklace",earrings:"Earrings",wristwear:"Watch",bag:"Bag",belt:"Belt",lower_body:"Bottoms",full_body:"Full Outfit",upper_body:"Top"}[e]||"Top"}function oe(e,t){let a=e.garmentCategory||mt(e.name,e.category),n=e.id||`layer_${Date.now()}`;t&&(x=[]);let o={id:n,name:e.name||"Fashion Item",category:e.category||"Garment",garmentCategory:a,imageUrl:e.imageUrl,enabled:!0,scale:1,offsetY:0,opacity:ae,imageElement:null,processedCanvas:null,availableSizes:e.availableSizes||["XS","S","M","L","XL","XXL"]},c=x.findIndex(s=>s.garmentCategory===a);c>=0?x[c]=o:x.push(o),me&&(me.textContent=o.name),be&&(be.textContent=`${Ue(a)} \xB7 ${o.category}`),R&&(R.style.display="block",R.src=o.imageUrl,R.onerror=()=>{R.style.display="none"});let r=new Image;r.crossOrigin="anonymous",r.onload=()=>{o.imageElement=r,o.processedCanvas=ut(r),F(),ht(o.availableSizes),k(`\u2726 ${o.name.slice(0,26)} ready!`)},r.onerror=()=>{let s=new Image;s.onload=()=>{o.imageElement=s,F()},s.src=o.imageUrl},r.src=o.imageUrl,F(),te()}function F(){if(j){if(j.innerHTML="",x.length===0){j.innerHTML='<div class="v-outfit-empty">No items loaded yet. Try a sample or grab from the page.</div>',te();return}x.forEach(e=>{let t=document.createElement("div");t.className=`v-layer-card${e.enabled?"":" disabled"}`;let a=document.createElement("img");a.className="v-layer-thumb",a.src=e.imageUrl,a.alt=e.name,a.onerror=()=>{a.style.display="none"};let n=document.createElement("div");n.className="v-layer-info",n.innerHTML=`<div class="v-layer-cat">${Ue(e.garmentCategory)}</div><div class="v-layer-name" title="${e.name}">${e.name}</div>`;let o=document.createElement("div");o.className="v-layer-btns";let c=document.createElement("button");c.className=`v-layer-btn ${e.enabled?"on":""}`,c.textContent=e.enabled?"\u2713":"\u25CB",c.addEventListener("click",s=>{s.stopPropagation(),e.enabled=!e.enabled,F()});let r=document.createElement("button");r.className="v-layer-btn remove",r.textContent="\xD7",r.addEventListener("click",s=>{s.stopPropagation(),x=x.filter(d=>d.id!==e.id),F(),te(),k(`Removed ${e.name.slice(0,20)}`)}),o.appendChild(c),o.appendChild(r),t.appendChild(a),t.appendChild(n),t.appendChild(o),j.appendChild(t)}),te()}}function te(){if(!fe)return;let e=x.filter(a=>a.enabled).length,t=x.length;fe.textContent=t===0?"0":e===t?`${t}`:e===0?"0/"+t:`${e}/${t}`}function bt(e,t,a){let n=e.landmarks,o=n[5],c=n[6],r=n[11],s=n[12],d=(A,M)=>Math.sqrt((A.x-M.x)**2+(A.y-M.y)**2),g=d(o,c),l=d(r,s),i=d({x:(o.x+c.x)/2,y:(o.y+c.y)/2},{x:(r.x+s.x)/2,y:(r.y+s.y)/2}),p=Math.max(1,g/44),m=Math.round(g/p),u=Math.round(g*2.1/p),b=Math.round(l*2.4/p),v=Math.round(i/p);he&&(he.textContent=`${m} cm`),ve&&(ve.textContent=`${u} cm`),ye&&(ye.textContent=`${b} cm`),xe&&(xe.textContent=`${v} cm`);let E=ft(m,u,b);re&&(re.textContent=E),vt(E)}function ft(e,t,a){let n="M",o=1/0;for(let[c,r]of Object.entries(Ye)){let s=Math.abs(e-(r.shoulder[0]+r.shoulder[1])/2)*2+Math.abs(t-(r.chest[0]+r.chest[1])/2)+Math.abs(a-(r.waist[0]+r.waist[1])/2);s<o&&(o=s,n=c)}return n}function ht(e){if(!B)return;B.innerHTML="";let t=re?.textContent||"M";e.forEach(a=>{let n=document.createElement("button");n.className=`v-size-pill${a===t?" rec":""}`,n.textContent=a,n.addEventListener("click",()=>{B.querySelectorAll(".v-size-pill").forEach(o=>o.classList.remove("selected")),n.classList.add("selected"),k(`Selected size: ${a}`)}),B.appendChild(n)})}function vt(e){B?.querySelectorAll(".v-size-pill").forEach(t=>{t.classList.toggle("rec",t.textContent===e)})}function yt(){if(!y||!w)return;let e=document.createElement("canvas");e.width=y.videoWidth||640,e.height=y.videoHeight||480;let t=e.getContext("2d");z==="user"?(t.scale(-1,1),t.drawImage(y,-e.width,0,e.width,e.height),t.scale(-1,1)):t.drawImage(y,0,0),t.drawImage(w,0,0),t.font="bold 14px Inter,sans-serif",t.fillStyle="rgba(255,255,255,0.75)",t.fillText("\u2726 VESTORA",12,e.height-12);let a=document.createElement("a");a.download=`vestora-${Date.now()}.png`,a.href=e.toDataURL(),a.click(),k("\u2726 Screenshot saved!")}var ue=null;function k(e){let t=h?.getElementById("v-toast-text");!ee||!t||(ue&&clearTimeout(ue),t.textContent=e,ee.classList.add("visible"),ue=setTimeout(()=>{ee.classList.remove("visible")},2800))}var V=new Y("ProductDetector");(function(){if(window.__vestoraInitialized)return;window.__vestoraInitialized=!0,V.info("VESTORA autonomous product detector active on",location.hostname);let t=null,a=!1;function n(){["#__decart-tryon-widget","#__decart-pill-btn",".vton-btn","[id*='decart']","[class*='anywear']","[id*='anywear']"].forEach(p=>{document.querySelectorAll(p).forEach(m=>{try{m.style.setProperty("display","none","important"),m.remove()}catch{}})})}if(location.hostname.toLowerCase().includes("google.")||Ce()){V.info("Google Search/Images detected \u2014 activating dedicated Google Images Try-On Scanner"),He(g);return}n(),Ae(()=>{let i=t||d()||{id:`prod_dock_${Date.now()}`,name:document.title.split(/[-|·]/)[0].trim()||"Detected Apparel",brand:location.hostname.replace("www.","").split(".")[0].toUpperCase(),imageUrl:"",productUrl:location.href,pageUrl:location.href,category:"upper_body",isFashion:!0,availableSizes:["S","M","L","XL"],outOfStockSizes:[],confidence:1,detectionSource:"dom-heuristic"};g(i)});let c=new IntersectionObserver(i=>{i.forEach(p=>{if(p.isIntersecting){let m=p.target;c.unobserve(m),T(m)&&q(m,g)}})},{rootMargin:"300px 0px"});function r(i=document){n(),Array.from(i.querySelectorAll("img")).forEach(b=>{b.complete&&b.naturalWidth>0?T(b)&&q(b,g):(b.addEventListener("load",()=>{T(b)&&q(b,g)},{once:!0}),c.observe(b))});let m=["[style*='background-image']",".image-grid-image",".image-grid-col",".pdp-image-container",".product-sliderContainer",".product-image",".img-container",".prod-image",".product__media",".product-single__photo",".product-media",".gallery-image","[data-testid*='product-image']","._396cs4","#landingImage",".product-base",".results-base"].join(", ");Array.from(i.querySelectorAll(m)).forEach(b=>{T(b)&&q(b,g)}),a||s()}function s(){let i=se(document,location);if(i.isProductPage){V.info("Generic PDP detected with confidence:",i.confidence,"Signals:",i.signals);let p=ce(document,location);p&&p.imageUrl&&(t=p,a=!0,chrome.runtime.sendMessage({type:"VESTORA_PRODUCT_DETECTED",payload:p}).catch(()=>{}),Ie(p,g))}}function d(){if(t)return t;let i=ce(document,location);if(i&&i.imageUrl)return t=i,i;let m=Array.from(document.querySelectorAll("img, [style*='background-image'], .image-grid-image, .image-grid-col")).filter(T);if(m.length>0){let u=m[0],b=P(u);if(b)return t=$(u,b),t}return null}function g(i){V.info("User requested try-on for:",i.name),t=i;let p={type:"VESTORA_PRODUCT_DETECTED",payload:i};if(chrome.runtime.sendMessage(p).catch(()=>{}),document.getElementById("vestora-panel-host")){Ne(i);return}X(i)}r(document),new MutationObserver(()=>{r(document)}).observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{a||s()},1500),chrome.runtime.onMessage.addListener((i,p,m)=>{if(i&&i.type==="VESTORA_OPEN_TRYON"){V.info("Received request to open try-on from popup/action");let u=t||d();if(u)X(u),m?.({success:!0,product:u});else{let b=Array.from(document.querySelectorAll("img"));for(let v of b)if(T(v)){let E=P(v),A=$(v,E);X(A),m?.({success:!0,product:A});break}}return!1}if(i&&i.type==="VESTORA_REQUEST_PAGE_PRODUCT"){let u=t||d();return m?.({success:!!u,product:u}),!1}})})();})();
