var suppressHistRem={b:false,u:[]};
var tbs=[];
var ts = document.getElementById("time_s");
var t0 = document.getElementById("time0");
var t1 = document.getElementById("time1");
var t2 = document.getElementById("time2");
var t3 = document.getElementById("time3");

function getUrl(tab) {
	return (tab.url == "" && !!tab.pendingUrl && typeof tab.pendingUrl !== 'undefined' && tab.pendingUrl != '') ? tab.pendingUrl : tab.url;
}

function retain_spl_arr(s,c){
var sa= s.split(c);
for (let i= sa.length; i-->1;){
    sa.splice(i, 0, c);
}
var sb=[];
for (let k= 0; k < sa.length; k++){
if(sa[k]!=''){
sb.push(sa[k]);
}
}
return sb;
}

function elRemover(el){
	if(typeof el!=='undefined' && !!el){
	if(typeof el.parentNode!=='undefined' && !!el.parentNode){
		el.parentNode.removeChild(el);
	}
	}
}

async function tabs_discard(d){
	return new Promise(function(resolve) {
				chrome.tabs.discard(d, function(tab){
						resolve();
				});
	});
}

var searchHistory = function (filterArr,clear,titleToo,reGatherChecked,startUp,searchInput) {
	if(searchInput===true){
		let ticked=[...document.getElementById('checkboxes').querySelectorAll('input[type="checkbox"]:checked')];
		
		for (let i=0; i<ticked.length; i++){
			ticked[i].checked=false;
		}
	}
	if((clear && !reGatherChecked) || startUp){
		 buildNavigationOptions();
	}
		chrome.history.search({
		text: '',
		startTime: 0,
		maxResults: 0
    }, function(hist){
		if( (clear && !reGatherChecked) || (filterArr==[''] && !reGatherChecked)){
			constructHistory(hist);
		}else{
		let filtHist=[];
		
		if(reGatherChecked){
			var tickDmns=[];
			
			let ticked=[...document.getElementById('checkboxes').querySelectorAll('input[type="checkbox"]:checked')];
			
			for (let i=0; i<ticked.length; i++){
				let dmn=ticked[i].parentElement.getAttribute('domain');
				if(dmn!==''){
					tickDmns.push(dmn);
				}
			}
		}
		
		for (let i = 0; i < hist.length; i++) {
			for (let k = 0; k < filterArr.length; k++) {
				let hl=hist[i].title.toLocaleLowerCase();
				let hlu=hist[i].url.toLocaleLowerCase();
				let fl=filterArr[k].toLocaleLowerCase();
				if(reGatherChecked && tickDmns.length>0){
					for (let n = 0; n<tickDmns.length; n++) {
						if(titleToo){
							if((hlu.indexOf(tickDmns[n])>=0) ){
								if( (hlu.indexOf(filterArr[k]) >= 0) || (hl.indexOf(fl) >= 0) ){
									 filtHist.push(hist[i]);
								}
							}
						}else{
							if((hlu.indexOf(tickDmns[n].toLocaleLowerCase())>=0) ){
								if( hlu.indexOf(fl) >= 0 ){
									 filtHist.push(hist[i]);
								}
							}
						}
					}
				}else{
					if(titleToo){
						if( (hlu.indexOf(fl) >= 0) || (hl.indexOf(fl) >= 0) ){
						filtHist.push(hist[i]);
						}
					}else{
						if( hlu.indexOf(fl) >= 0 ){
						filtHist.push(hist[i]);
						}
					}					
				}
			}
		}
		
		
		if(searchInput===true){
			constructHistory(filtHist);
			constructNavigationOptions(filtHist);
		}else{
			constructHistory(filtHist);
			updHistChk();
		}
	}
	});
	

}

function getAdjCurrDateTimeOffset(outISO,ignoreTimeZones,offst){
	offst=(typeof offst==='undefined')?0:offst;
	let now = new Date();
    let tz_offset = (typeof ignoreTimeZones==='undefined' || !ignoreTimeZones)?now.getTimezoneOffset() * 60000:0	;
	let t=now.getTime()- tz_offset + offst;
	if(outISO){
		return new Date(t).toISOString();
	}else{
		return t;
	}
}

function getAdjDateTimeOffset(thenTime, outISO,ignoreTimeZones,offst){
	offst=(typeof offst==='undefined')?0:offst;
	let now = new Date();
    let tz_offset = (typeof ignoreTimeZones==='undefined' || !ignoreTimeZones)?now.getTimezoneOffset() * 60000:0	;
	let t=thenTime+ tz_offset + offst;
	if(outISO){
		return new Date(t).toISOString();
	}else{
		return t;
	}
}

function domainTimeFilter(unique,hostnames_ixs,historyItems){
	let filtHist=[];
	let histTimes=[];
	let out=[[],[],[],[]];
	for (let i=0, len_i=unique.length; i<len_i; i++){
		let ij=hostnames_ixs[unique[i]]; //array of indexes
		let inLimit=true;
		for (let j=0, len_j=ij.length; j<len_j; j++){
			let chk=inTimeLimit(historyItems[ ij[j] ]);
			histTimes[ ij[j] ]=chk[1];
			if(chk[0]===false){
				inLimit=false;
				j=len_j-1;
			}
		}
		if(inLimit===true){
			for(let ix=0, len=ij.length; ix<len; ix++){
					filtHist.push(ij[ix]);
			}
			out[1].push(unique[i]);
			out[3].push(  hostnames_ixs[ unique[i]  ].length);
		}
	}
	
	for (let j=0, len_j=filtHist.length; j<len_j; j++){
		out[0].push(historyItems[ filtHist[j] ]);
		out[2].push(histTimes[ filtHist[j] ]);
	}
	return out;
}

function pre_timeFilter(historyItems){
	var unique= []; //unique hostnames
    var hostnames_ixs={};
    historyItems.forEach(function (item,index) {
		let spl3=item.url.split('///')
		let hst=(spl3.length>1)?spl3[0]:item.url.split('/')[2];
		item.domain=hst;
		if(!unique.includes(hst)){
			unique.push(hst);
			hostnames_ixs[hst]=[index];
		}else{
			hostnames_ixs[hst].push(index);
		}
    });
	//if(ts.selectedIndex===1){			
		return domainTimeFilter(unique,hostnames_ixs,historyItems);
	/*}else{
		return [historyItems,unique]
	}*/
}

function inTimeLimit(i){
	let t0s=t0.selectedIndex;
	let t2s=t2.selectedIndex;
	let dt=(t0s>=3)?true:false;
	let time_now=getAdjCurrDateTimeOffset(false,(dt)?false:true);
	let time_mult=60000;
	
	if(t2s==1){
						time_mult=3600000;
	}else if(t2s==2){
						time_mult=86400000;
	}else if(t2s==3){
						time_mult=604800000;
	}
	
	
				let time_then=getVisitTime(i);
				let ms=0;
				
				if(dt){
					ms=getAdjDateTimeOffset(t3.valueAsNumber,false);
				}else{
						ms=t1.valueAsNumber*time_mult;
				}
				
				let pass=false;
				if(t0s==0){
					pass=true;
				}else if(t0s==1){
						if(time_now-time_then[0]<=ms){
							pass=true;
						}
				}else if(t0s==4){
						if(time_then[0]<=ms){
							pass=true;
						}
				}else if(t0s==2){
						if(time_now-time_then[0]>=ms){
							pass=true;
						}
				}else if(t0s==3){
						if(time_then[0]	>=ms){
							pass=true;
						}
				}
				return [pass,time_then];
}

function timeFilter(historyItemsRaw){
		let historyItems=pre_timeFilter(historyItemsRaw);
		if(ts.selectedIndex===1){
			
			return historyItems;
		}else{
			let filt=[[],[],[],[]];
			let dmns={};	
			let unq=[];	
			for (let i=0, len_i=historyItems[0].length; i<len_i; i++){
					let item=historyItems[0][i];
					let pass=inTimeLimit(item);
					if(pass[0] && typeof(item)!=='undefined' && typeof(item.domain)!=='undefined'){
						filt[0].push(item);
						filt[2].push(pass[1]);
						let dmn=item.domain;
						if(typeof(dmns[dmn])==='undefined'){
							dmns[dmn]=1;
						}else{
							dmns[dmn]+=1;
						}
					}
			}
			for(key in dmns){
				filt[1].push(key);
				filt[3].push(dmns[key]);
			}
			return filt;
		}
}

var constructHistory = function (historyItems) {
	var hitb=document.createElement('TR');
	hitb.className='item core_history_item';
	
	hitb.innerHTML=`<td class="select"><input type="checkbox" name="history[]" value=""></td>
					<td colspan="2" class="info">
						<p class="info_title">
							<!-- <span class="icon favicon" style=""></span> -->
							<a class="title" target="_blank" href=""></a>
						</p>
						<p class="info_time">
							Last Visit Time on:
							<span class="time_info"></span>
						</p>
						<p class="info_url">
							<span class="icon url"></span>
							<a class="full_url" target="_blank"
								href="#"></a>
						</p>
					</td>`;
		
    var historyTable = $("#historyContainer .item_table");
    var trOriginal = $(hitb,".core_history_item");
    $(".item_table .noData").hide();
    historyTable.find(".item").remove();
    if (historyItems.length == 0) {
        $(".item_table .noData p").text("No history found!");
        $(".item_table .noData").show();
    }else{

		historyItemsThen=timeFilter(historyItems);
		historyItems=historyItemsThen[0].map((h)=>{return h;});
		
		historyItems.forEach(function (item,index) {
				var tr = trOriginal.clone();
				tr.removeClass('core_history_item');
				//tr.addClass('item');
				tr.find("td.select input[name='history[]']").val(item.url);
				let ttl=tr.find("p.info_title a.title");
					ttl.text(item.title ? item.title : item.url).attr('href', item.url).attr('title', item.url);
				//tr.find("p.info_title span.favicon").css('content', 'url("chrome://favicon/' + item.url + '")');
				let ti=tr.find("p.info_time span.time_info");
				let tm=historyItemsThen[2][index];
				if(index===0){
					let tms=tm[1]+' ('+tm[2]+')';
					ti.text(tms);
				}else{
					ti.text(tm[1]);
				}
				ti[0].title=tm[2];
				let full=tr.find("p.info_url a.full_url");
				full.text(item.url).attr('href', item.url);
				if((item.title === item.url) || item.title==='' ){
					full[0].style.display='none';
				}
				historyTable.append(tr);
		});
	}
}

var buildNavigationOptions = function () {
    chrome.history.search({
						text: "",
						startTime: 0,
						maxResults: 0
    }, constructNavigationOptions);
}

function updHistChk(){
	let recordType='history';
	let items = $("#" + recordType + "Container tr.item input[name='" + recordType + "[]']");
	if($("#allHistories")[0].checked) {
		items.prop('checked', true);
	}
		updateRemoveButton(recordType);
}

function attachCheckEvts(){
		    let checkboxs = document.getElementById("checkboxes");
	    let lbls=[...checkboxs.getElementsByTagName('label')];
		let lblc=lbls.map((l)=>{return [...l.querySelectorAll('input[type="checkbox"]')][0]});
		let lblcd=lblc.slice(1);
		
		for(let i=0; i<lblc.length; i++){
				
			let ckb=lblc[i];

			if(i==0){
				ckb.oninput=function(){
						if(ckb.checked){
							for(let k=0; k<lblc.length; k++){
								lblcd[k].checked=true;
							}
							
							if( $("#searchTerm")[0].value!==''){
								searchHistory([ $("#searchTerm")[0].value],false,true,true,false);
							}else{
								searchHistory([''],false,false,true,false);
							}
										
						}else{
							for(let k=0; k<lblc.length; k++){
								lblcd[k].checked=false;
							}
						}	
			}
			}else{
					ckb.oninput=function(){
						
						let lc=lblcd.filter((i)=>{return i.checked;});
						lblc[0].checked=(lblcd.length===lc.length)?true:false;
						
						if( $("#searchTerm")[0].value!==''){
							searchHistory([ $("#searchTerm")[0].value],false,true,true,false);
						}else{
							searchHistory([''],false,false,true,false);
						}
					}
			}
		}
}

var constructNavigationOptions = function (historyItems) {
    var searchForm = $("#searchForm");
    var checkboxs = document.getElementById("checkboxes");

	
	historyItemsThen=timeFilter(historyItems);
	historyItems=historyItemsThen[0].map((h)=>{return h;});
	unique=historyItemsThen[1];
	numEntries=historyItemsThen[3];
	
	let nw_unique=[];
	
	for (let i=0, len=unique.length; i<len; i++){
				let dts1=retain_spl_arr(unique[i],'.');
				let dts='';
				let dts_f='';
				if(dts1.indexOf('.')!=dts1.lastIndexOf('.')){
						let hadDot=false;
						let lettr=-2;
						for (let k=0; k<dts1.length; k++){
							if(hadDot){
								dts+=dts1[k];
							}else if(dts1[k]=='.'){
								hadDot=true;
								lettr=k;
							}
							
							if(hadDot && lettr==k-1){
								let sbs=[...dts1[k]];
								dts_f+='<strong>'+sbs[0]+'</strong>';
								for(let n=1; n<sbs.length; n++){
									dts_f+=sbs[n];
								}
								lettr=-2;
							}else{
								dts_f+=dts1[k];
							}

						}
						
						if(!nw_unique.includes(dts)){
							nw_unique.push([dts,unique[i],dts_f,numEntries[i]]);
						}
						
				}else{
					if(dts1.indexOf('.')!=dts1.lastIndexOf('.')){
						let hadDot=false;
						let lettr=-2;
							for (let k=0; k<dts1.length; k++){
							 if(dts1[k]=='.'){
								hadDot=true;
								lettr=k;
							}
							
							if(hadDot && lettr==k-1){
								let sbs=[...dts1[k]];
								dts_f+='<strong>'+sbs[0]+'</strong>';
								for(let n=1; n<sbs.length; n++){
									dts_f+=sbs[n];
								}
								lettr=-2;
							}else{
								dts_f+=dts1[k];
							}

						}
					
			
			}else if(unique[i]!==''){
				let sbs=[...unique[i]];
				dts_f+='<strong>'+sbs[0]+'</strong>';
								for(let n=1; n<sbs.length; n++){
									dts_f+=sbs[n];
								}
			}
								if(!nw_unique.includes(unique[i])){
					nw_unique.push([unique[i],unique[i],dts_f,numEntries[i]]);
					}	
			
				}
	}

	nw_unique.sort(function(a, b) {
		if(a[0] < b[0]) { return -1; }
		if(a[0] > b[0]) { return 1; }
		if(a[0] === b[0]){
			if(a[1] < b[1]) { return -1; }
			if(a[1] > b[1]) { return 1; }
		}
		return 0;
	});
				
			let unq=[['',0]];
			
	for (let i=0; i<nw_unique.length; i++){
		if(nw_unique[i][2]!==''){
			unq.push([nw_unique[i][2],nw_unique[i][3],nw_unique[i][1]]);
		}
	}
			nw_unique=unq;
			checkboxs.innerHTML='';
    nw_unique.forEach(function (item, index) {
		let cb=document.createElement('input');
		cb.type='checkbox';
		cb.id='l'+index;
		let no_entries=index===0?'':' ('+item[1]+')';
		checkboxs.insertAdjacentHTML('beforeend','<label domain="'+item[2]+'" for="l'+index+'">'+cb.outerHTML+item[0]+no_entries+'</label>');
		
    });
attachCheckEvts();
}

var getVisitTime = function (item) {
    let options = {weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: 'numeric'};
	let t=item.lastVisitTime;
	let tz= -(new Date().getTimezoneOffset() / 60);
	tz=(tz===-0)?0:tz;
	let tzn=tz.toLocaleString('en-GB', {minimumFractionDigits: 0, maximumFractionDigits: 7});
	let tzt='';
	if(tz>0){
		tzt='+'+tzn;
	}else if (tz<0){
		tzt=tzn;
	}
    return [t, new Date(t).toLocaleTimeString("en-GB", options),('GMT'+tzt)];
}

var resetRemoveCheckBoxes = function (recordType) {
    $("#" + recordType + "Container tr input[type='checkbox']").prop('checked', false);
    updateRemoveButton(recordType);
}
var updateRemoveButton = function (recordType) {
    var items = $("#" + recordType + "Container tr.item input[name='" + recordType + "[]']");
    var removeButtonObj = $("#remove" + recordType.charAt(0).toUpperCase() + recordType.substr(1));
    if (items.filter(':checked').length > 0) {
        var record = ' record';
        if (items.filter(':checked').length > 1) {
            record = ' records';
        }
        if (recordType != 'tab') {
            removeButtonObj.show().text("Remove (" + items.filter(':checked').length + ") " + recordType + record);
        }
    } else {
        if (recordType != 'tab') {
            removeButtonObj.text("Remove " + recordType + " records");
        }
    }
}
var getRecordType = function (obj) {
    var tabcontentId = $(obj).closest('.tabcontent').attr('id');
    var recordType = tabcontentId.replace("Container", "");
    return recordType;
}

$( document ).ready(function() {
		    searchHistory([''],true,false,true,true);
var expanded = false;
$('hr#divider')[0].style.setProperty( 'display','block');
var overDivd={over:false, top:$('hr#divider')[0].getBoundingClientRect().top};
overDivd.defTop=overDivd.top;
$('hr#divider')[0].style.setProperty( 'display','none');
var checkboxes = document.getElementById("checkboxes");
var selBox = document.getElementById("selectBox");

let t0 = document.getElementById("time0");
let t1 = document.getElementById("time1");
let t2 = document.getElementById("time2");
let t3 = document.getElementById("time3");

t3.value=getAdjCurrDateTimeOffset(true).split('T')[0]+'T23:59';
t3.valueAsNumber+=59999;
t3.max=t3.valueAsNumber;

t3.value=getAdjCurrDateTimeOffset(true,true,-1209600000).split('Z')[0].split('T')[0]+'T00:00';

function upd_ptr(event){
	let t3AsN=t3.valueAsNumber;
	t3.value=getAdjCurrDateTimeOffset(true).split('T')[0]+'T23:59';
	t3.valueAsNumber+=59999;
	t3.max=t3.valueAsNumber;

	t3.valueAsNumber=t3AsN;
}

t3.onpointerenter=(event)=>{
	upd_ptr(event);
}

t3.onpointerleave=(event)=>{
	upd_ptr(event);
}

t2.selectedIndex=3;

t1.style.display='none';
t2.style.display='none';
t3.style.display='none';

function textSearch(searchInput){
			 let text =  $("#searchTerm")[0].value;
		if(text!==''){
			searchHistory([text],false,true,true,false,searchInput);
		}else{
			  searchHistory([''],false,false,true,false,searchInput);
		}
}
function title_search(){
			textSearch(true);
			 //buildNavigationOptions();
}

ts.oninput=()=>{
	if(!expanded && ts.selectedIndex===1){
		selBox.click();
	}
	title_search();
}

t0.oninput=()=>{
	if(t0.selectedIndex==0){
		t1.style.display='none';
		t2.style.display='none';
		t3.style.display='none';
	}else if(t0.selectedIndex<=2){
		t1.style.display='initial';
		t2.style.display='initial';
		t3.style.display='none';
	}else{
		t1.style.display='none';
		t2.style.display='none';
		t3.style.display='initial';
	}
	title_search();
}
	
	
t1.oninput=()=>{
		if(t1.valueAsNumber==1){
		t2.children[0].innerText="minute ago";
		t2.children[1].innerText="hour ago";
		t2.children[2].innerText="day ago";
		t2.children[3].innerText="week ago";
	}else{
		t2.children[0].innerText="minutes ago";
		t2.children[1].innerText="hours ago";
		t2.children[2].innerText="days ago";
		t2.children[3].innerText="weeks ago";
	}
	title_search();
}

t1.onwheel=(evt)=>{
	evt.preventDefault();
	evt.stopPropagation();
	let mn=parseFloat(t1.min);
		if(evt.deltaY>0){
			let n=(Number.isNaN(t1.valueAsNumber))?1:t1.valueAsNumber-1;
			t1.value=(n<mn)?mn:n;
			t1.dispatchEvent(new Event('input'));
		}
		if (evt.deltaY<0){
			let n=(Number.isNaN(t1.valueAsNumber))?1:t1.valueAsNumber+1;
			t1.value=(n<mn)?mn:n;
			t1.dispatchEvent(new Event('input'));
		}
}

t2.oninput=()=>{
	title_search();
}

t3.oninput=()=>{
	title_search();
}

selBox.addEventListener('click',showCheckboxes);
function showCheckboxes() {
  if (!expanded) {
    checkboxes.style.setProperty( 'display','block');
    expanded = true;
	$('hr#divider')[0].style.setProperty( 'display','block');
	overDivd.top=$('hr#divider')[0].getBoundingClientRect().top;
	overDivd.defTop=overDivd.top;
  } else {
	checkboxes.style.setProperty( 'display','none');
    expanded = false;
	$('hr#divider')[0].style.setProperty( 'display','none');
  }
}

    $("#searchTerm").on("input", function (event) {
			textSearch(true);
    });
	
	$('button#clearTerm').on("mouseup", function (e) {
		$( "#searchTerm")[0].value='';
		 searchHistory([''],false,false,true,false);
	});

    $(document).on('input', ".item_table tbody .select input[type='checkbox']", function () {
		let i=[...document.querySelectorAll(".item_table tbody .select input[type='checkbox']")];
		let ic=i.filter((i)=>{return i.checked;});
		$("#allHistories")[0].checked=(i.length===ic.length)?true:false;
        updateRemoveButton(getRecordType(this));
    });
	
	$("#allHistories").on("input", function () {
        var recordType = getRecordType(this);

        var items = $("#" + recordType + "Container tr.item input[name='" + recordType + "[]']");
        if ($(this).is(":checked")) {
            items.prop('checked', true);
        } else {
            items.prop('checked', false);
        }

        updateRemoveButton(recordType);

    });

   $(".action").on("click", function (e) {
        var recordType = getRecordType(this);
        var items = $("#" + recordType + "Container tr.item input[name='" + recordType + "[]']");

        let chkd=items.filter(':checked');
		
		function postBtn_act(){
					$("input#allHistories")[0].checked=false;
					$('button#removeHistory').prop('checked', false).closest('tr.item').hide();
									
				items = $("#" + recordType + "Container tr.item input[name='" + recordType + "[]']");
				
				if ($('button#removeHistory').is(":checked")) {
					items.prop('checked', true);
				}else{
					items.prop('checked', false);
				}
				
				updateRemoveButton(recordType);
}
					async function del() {
						return new Promise(function(resolve) {
							if(chkd.length>0){
									let rmb=$('button#removeHistory')[0];
									rmb.classList.add('del_info');
									var count=0;
									suppressHistRem.b=true;
									for (let i=0; i<chkd.length; i++) {	
										suppressHistRem.u.push( chkd[i].value);
										try{
											chrome.history.deleteUrl({
												url: chkd[i].value
											}, function(){
												count++;
												if(count==chkd.length){
													suppressHistRem.b=false;
													rmb.classList.remove('del_info');
													rmb.innerHTML="Remove history records";
													resolve();
												}else{
													rmb.innerHTML=count+"/"+chkd.length+" history records removed";
												}
											});
										}catch(e){
											count++;
											if(count==chkd.length){
												suppressHistRem.b=false;
												rmb.classList.remove('del_info');
												rmb.innerHTML="Remove history records";
												resolve();
											}else{
												rmb.innerHTML=count+"/"+chkd.length+" history records removed";
											}
										}
									}
						}else{
							resolve();
						}
						});
				}
				
				async function opn(disc) {
					return new Promise(function(resolve) {
						if(chkd.length>0){
									var count=0;
									for (let i=0; i<chkd.length; i++) {
										let addr=chkd[i].value;
										try{
											chrome.tabs.create({
												url: addr,
												active: false		
											}, function(tab){
													count++;
													if(disc){
														tbs.push({id: tab.id});
													}
													if(count==chkd.length){
														resolve();
													}
											});
										}catch(e){
												count++;
												if(count==chkd.length){
													resolve();
												}
										}
									}
						}else{
							resolve();
						}
				});
				}



if(chkd.length>=1){
		if(e.target.id==='removeHistory' && !e.target.classList.contains('del_info')){
			var chk=true;
			if(chkd.length!=1){
				chk = confirm("Are you sure you want to delete multiple entries?");
			}

			if(chk){	
				(async ()=>{ 
					await del();
					postBtn_act();
					onHistRem();
				})();
			}else{
				postBtn_act();
			}
		}else if(e.target.id==='openLinks'){
			(async ()=>{ 
				await opn(false);
				postBtn_act();
			})();
			
		}else if(e.target.id==='openLinksDisc'){
			(async ()=>{ 
				await opn(true);
				postBtn_act();
			})();	
		}else if(e.target.id==='copyLinks'){
			let cpy='';
			if(chkd.length>1){
				for (let i=0; i<chkd.length-1; i++) {
					cpy+=chkd[i].value+'\n';
				}
			}
			cpy+=chkd[chkd.length-1].value;		
			let txt = document.createElement("textarea");
			txt.style.maxHeight = '0px'
			document.body.appendChild(txt);
			txt.value = cpy;
			txt.select();
			document.execCommand("copy");
			elRemover(txt);
			postBtn_act();
	}else{
			postBtn_act();
	}
							

}

    });

    $(document).on("click", ".linkTo", function () {
        $(this).attr('href');
        chrome.tabs.create({'url': $(this).attr('href'), 'active': true});
    });   

	$(document).on("click", "a", function (e) {
        e.preventDefault();
		chrome.tabs.create({'url': $(this).attr('href')});
    });
	
	$('hr#divider').on("dblclick", function () {
        overDivd.over=(overDivd.over)?overDivd.over:false;
		$('hr#divider')[0].style.setProperty( 'top',(overDivd.defTop+3)+'px' );
		 let chk=document.getElementById("checkboxes");
		   let chkRct=chk.getBoundingClientRect();
			  chk.style.setProperty( 'height',Math.max(0,overDivd.defTop-chkRct.top-$('hr#divider')[0].clientHeight-4)+'px' );
    });	
	
	$('hr#divider').on("mouseenter", function () {
        overDivd.over=true;
		overDivd.top=$('hr#divider')[0].getBoundingClientRect().top;
    });
	
	$('hr#divider').on("mouseleave", function (e) {
		if(e.buttons==0){
        overDivd.over=false;
		}
    });
	
	$(document).on("mousemove", function (e) {
		e.preventDefault();
       if(overDivd.over && e.buttons>0){	
		   let chk=document.getElementById("checkboxes");
		   let chkRct=chk.getBoundingClientRect();
		   let tp=Math.max(e.pageY,chkRct.top);
		   $('hr#divider')[0].style.setProperty( 'top',(tp+2)+'px' );
		  chk.style.setProperty( 'height',Math.max(0,tp-chkRct.top-$('hr#divider')[0].clientHeight-4)+'px' );
		   overDivd.top=$('hr#divider')[0].getBoundingClientRect().top;
	   }
    });	
	
	$(document).on("mouseup", function (e) {
       overDivd.over=(overDivd.over)?false:overDivd.over;
    });
	
	function onHistRem(){
		if(!suppressHistRem.b){
			$("#searchTerm")[0].value='';
			$("input#allHistories")[0].checked=false;
			searchHistory([''],true,false,true,true);
		}
	}
	


	
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if(changeInfo.url){
		let ix=tbs.findIndex((t)=>{return t.id===tabId;}); if(ix>=0){
			(async ()=>{ await tabs_discard(tabId); })();
			tbs=tbs.filter((t)=>{return t.id!==tabId;});
		}
	}
});

chrome.tabs.onCreated.addListener((tab)=>{
				let du=getUrl(tab);
				let vu=(!!du && typeof du!=="undefined" && du!=="")?true:false;
				let ix=tbs.findIndex((t)=>{return t.id===tab.id;}); 
				
			if( vu &&  ix>=0 && !du.startsWith('about:')){
					(async ()=>{ await tabs_discard(tab.id); })();
					tbs=tbs.filter((t)=>{return t.id!==tab.id;});
			}
			
});
	
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo){
	tbs=tbs.filter((t)=>{return t.id!==tabId;});
});

function replaceTabs(r,a){
	let ix=tbs.findIndex((t)=>{return t.id===r;}); if(ix>=0){
		tbs[ix].id=a;
	}
}

chrome.tabs.onReplaced.addListener(function(addedTabId, removedTabId) {
	replaceTabs(removedTabId,addedTabId);
});

chrome.history.onVisitRemoved.addListener(function(removed){
		for(let i=removed.urls.length-1; i>=0; i--){
			if(suppressHistRem.u.includes(removed.urls[i]) ){
				suppressHistRem.u=suppressHistRem.u.filter((l)=>{return l!==removed.urls[i]});
			}else{
				onHistRem();
			}
		}
});
	
chrome.history.onVisited.addListener(function(Historyitem){
					$("#searchTerm")[0].value='';
					$("input#allHistories")[0].checked=false;
	searchHistory([''],true,false,true,true);
});

});
