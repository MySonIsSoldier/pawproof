// Contract fixture, not a test of Kakao's actual map tiles or domain authorization.
export const fakeKakaoSdk = `(() => {
  class LatLng { constructor(lat,lng){ this.lat=lat;this.lng=lng; } getLat(){return this.lat;} getLng(){return this.lng;} }
  class Map {
    constructor(el, options){ this.el=el;this.center=options.center;this.level=options.level;this.listeners={};
      const pan=document.createElement('button');pan.textContent='테스트 지도 이동';
      pan.onclick=()=>{this.center=new LatLng(37.7,126.9);this.emit('idle');};el.append(pan);
    }
    emit(e){ for(const fn of this.listeners[e] || []) fn(); }
    setCenter(p){this.center=p;this.emit('idle');} getCenter(){return this.center;}
    setLevel(level){this.level=level;this.emit('idle');} getLevel(){return this.level;} relayout(){}
    getProjection(){return {containerPointFromCoords:p=>({x:p.lng*100000/2**(this.level-7),y:p.lat*100000/2**(this.level-7)})};}
    setBounds(bounds){this.el.dataset.bounds=JSON.stringify(bounds.points);}
  }
  class LatLngBounds { constructor(){this.points=[];} extend(p){this.points.push(p);} }
  class CustomOverlay { constructor(o){this.el=document.createElement('div');this.el.className='fixture-overlay';this.el.style.cssText='position:absolute;left:20px;top:'+(100+o.map.el.querySelectorAll('.fixture-overlay').length*50)+'px';this.el.append(o.content);o.map.el.append(this.el);} setMap(map){if(!map)this.el.remove();} }
  class Circle {setMap(){}}
  class Polyline {constructor(o){this.el=document.createElement('div');this.el.dataset.testRoute=JSON.stringify(o.path);o.map.el.append(this.el);}setMap(map){if(!map)this.el.remove();}}
  window.kakao={maps:{load:fn=>fn(),LatLng,Map,LatLngBounds,CustomOverlay,Circle,Polyline,event:{addListener:(map,e,fn)=>(map.listeners[e]??=new Set()).add(fn),removeListener:(map,e,fn)=>map.listeners[e]?.delete(fn),preventMap:()=>{}},services:{
    Geocoder:class {addressSearch(q,cb){cb([{x:'129.16',y:'35.16',address_name:'부산 해운대구'}],'OK');}},
    Places:class {keywordSearch(q,cb){cb([],'ZERO_RESULT');}}
  }}};
})();`;
