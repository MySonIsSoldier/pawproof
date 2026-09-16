// Contract fixture, not a test of Kakao's actual map tiles or domain authorization.
export const fakeKakaoSdk = `(() => {
  class LatLng { constructor(lat,lng){ this.lat=lat;this.lng=lng; } getLat(){return this.lat;} getLng(){return this.lng;} }
  class Map {
    constructor(el, options){ this.el=el;this.center=options.center;this.listeners={};
      const pan=document.createElement('button');pan.textContent='테스트 지도 이동';
      pan.onclick=()=>{this.center=new LatLng(37.7,126.9);this.listeners.idle?.();};el.append(pan);
    }
    setCenter(p){this.center=p;this.listeners.idle?.();} getCenter(){return this.center;} setLevel(){} relayout(){}
  }
  class CustomOverlay { constructor(o){this.el=o.content;o.map.el.append(this.el);} setMap(map){if(!map)this.el.remove();} }
  class Circle {setMap(){}}
  window.kakao={maps:{load:fn=>fn(),LatLng,Map,CustomOverlay,Circle,event:{addListener:(map,e,fn)=>map.listeners[e]=fn,removeListener:(map,e)=>delete map.listeners[e],preventMap:()=>{}},services:{
    Geocoder:class {addressSearch(q,cb){cb([{x:'129.16',y:'35.16',address_name:'부산 해운대구'}],'OK');}},
    Places:class {keywordSearch(q,cb){cb([],'ZERO_RESULT');}}
  }}};
})();`;
