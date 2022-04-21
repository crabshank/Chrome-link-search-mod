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

var searchHistory = function (filterArr,clear,titleToo,reGatherChecked,startUp) {
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
				let dmn=ticked[i].parentElement.textContent;
				if(dmn!==''){
					tickDmns.push(dmn);
				}
			}
		}
		
		for (let i = 0; i < hist.length; i++) {
			for (let k = 0; k < filterArr.length; k++) {
				
				if(reGatherChecked && tickDmns.length>0){
					for (let n = 0; n<tickDmns.length; n++) {
						if(titleToo){
							if((hist[i].url.toLocaleLowerCase().indexOf(tickDmns[n])>=0) ){
								if( (hist[i].url.toLocaleLowerCase().indexOf(filterArr[k]) >= 0) || (hist[i].title.toLocaleLowerCase().indexOf(filterArr[k].toLocaleLowerCase()) >= 0) ){
									 filtHist.push(hist[i]);
								}
							}
						}else{
							if((hist[i].url.toLocaleLowerCase().indexOf(tickDmns[n].toLocaleLowerCase())>=0) ){
								if( hist[i].url.toLocaleLowerCase().indexOf(filterArr[k].toLocaleLowerCase()) >= 0 ){
									 filtHist.push(hist[i]);
								}
							}
						}
					}
				}else{
					if(titleToo){
						if( (hist[i].url.toLocaleLowerCase().indexOf(filterArr[k].toLocaleLowerCase()) >= 0) || (hist[i].title.toLocaleLowerCase().indexOf(filterArr[k].toLocaleLowerCase()) >= 0) ){
						filtHist.push(hist[i]);
						}
					}else{
						if( hist[i].url.toLocaleLowerCase().indexOf(filterArr[k].toLocaleLowerCase()) >= 0 ){
						filtHist.push(hist[i]);
						}
					}					
				}
			}
		}
		constructHistory(filtHist);
						updHistChk();
	}
	});
	

}

function timeFilter(historyItems){
	let filt=[];			
	let t0 = document.getElementById("time0");
	let t1 = document.getElementById("time1");
	let t2 = document.getElementById("time2");
	let time_now=Date.now();
	
			historyItems.forEach(function (item) {
				let time_then=getVisitTime(item);
				let ms=0;
				if(t2.selectedIndex==0){
					ms=t1.valueAsNumber*60000;
				}else if(t2.selectedIndex==1){
					ms=t1.valueAsNumber*3600000;
				}else if(t2.selectedIndex==2){
					ms=t1.valueAsNumber*86400000;
				}else if(t2.selectedIndex==3){
					ms=t1.valueAsNumber*604800000;
				}
				let pass=false;
				if(t0.selectedIndex==0){
					pass=true;
				}else if(t0.selectedIndex==1){
						if(time_now-time_then[0]<=ms){
							pass=true;
						}
				}else if(t0.selectedIndex==2){
						if(time_now-time_then[0]>=ms){
							pass=true;
						}
				}
				if(pass){
					filt.push([item,time_then]);
				}
			});
	return filt;
}

var constructHistory = function (historyItems) {
    var historyTable = $("#historyContainer .item_table");
    var trOriginal = $("#coreItemTable .core_history_item");
    $(".item_table .noData").hide();
    historyTable.find(".item").remove();
    if (historyItems.length == 0) {
        $(".item_table .noData p").text("No history found!");
        $(".item_table .noData").show();
    }else{

		historyItemsThen=timeFilter(historyItems);
		historyItems=historyItemsThen.map((h)=>{return h[0];});
		
		historyItems.forEach(function (item,index) {
				var tr = trOriginal.clone();
				tr.removeClass('core_history_item');
				tr.addClass('item');
				tr.find("td.select input[name='history[]']").val(item.url);
				let ttl=tr.find("p.info_title a.title");
					ttl.text(item.title ? item.title : item.url).attr('href', item.url).attr('title', item.url);
				//tr.find("p.info_title span.favicon").css('content', 'url("chrome://favicon/' + item.url + '")');
				tr.find("p.info_time span.time_info").text(historyItemsThen[index][1][1]);
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
		
		for(let i=0; i<lbls.length; i++){
			
		let ckb=[...lbls[i].querySelectorAll('input[type="checkbox"]')][0];

		if(i==0){
			ckb.oninput=function(){
					if(ckb.checked){
						for(let k=0; k<lbls.length; k++){
							[...lbls[k].querySelectorAll('input[type="checkbox"]')][0].checked=true;
						}
						
					if( $("#searchTerm")[0].value!==''){
						searchHistory([ $("#searchTerm")[0].value],false,true,true,false);
					}else{
						searchHistory([''],false,false,true,false);
					}
								
					}else{
						for(let k=0; k<lbls.length; k++){
							[...lbls[k].querySelectorAll('input[type="checkbox"]')][0].checked=false;
						}
					}	
		}
		}else{
				ckb.oninput=function(){
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
    var hostnames = [];
    var months = [];
	
	historyItemsThen=timeFilter(historyItems);
	historyItems=historyItemsThen.map((h)=>{return h[0];});
	
    historyItems.forEach(function (item) {
		let spl3=item.url.split('///')
		let hst=(spl3.length>1)?spl3[0]:item.url.split('/')[2];
        hostnames.push(hst);
        months.push(item);
    });

    var unique = Array.from(new Set(hostnames)).filter((h)=>{return typeof h!=='undefined';});
	
	let nw_unique=[];
			    
	for (let i=0; i<unique.length; i++){
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
							nw_unique.push([dts,unique[i],dts_f]);
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
					nw_unique.push([unique[i],unique[i],dts_f]);
					}	
			
				}
	}

	unique=nw_unique.sort(function(a, b) {
		if(a[0] < b[0]) { return -1; }
		if(a[0] > b[0]) { return 1; }
		if(a[0] === b[0]){
			if(a[1] < b[1]) { return -1; }
			if(a[1] > b[1]) { return 1; }
		}
		return 0;
	});
				
			let unq=[''];
			
	for (let i=0; i<unique.length; i++){
		if(unique[i][2]!==''){
			unq.push(unique[i][2]);
		}
	}
			unique=unq;
			checkboxs.innerHTML='';
    unique.forEach(function (item, index) {
		let cb=document.createElement('input');
		cb.type='checkbox';
		cb.id='l'+index;
		
		checkboxs.insertAdjacentHTML('beforeend','<label for="l'+index+'">'+cb.outerHTML+item+'</label>');
		
    });
attachCheckEvts();
}

var getVisitTime = function (item) {
    var options = {weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: 'numeric'};
    var time = new Date(item.lastVisitTime);

    return [item.lastVisitTime,time.toLocaleTimeString("en-GB", options)];

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

t2.selectedIndex=3;

t1.style.display='none';
t2.style.display='none';

function title_search(){
	 buildNavigationOptions();
		 let text =  $("#searchTerm")[0].value;
		if(text!==''){
			searchHistory([text],false,true,true,false);
		}else{
			  searchHistory([''],false,false,true,false);
		}
}

t0.oninput=()=>{
	if(t0.selectedIndex==0){
		t1.style.display='none';
		t2.style.display='none';
	}else{
		t1.style.display='initial';
		t2.style.display='initial';
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
			title_search();
    });
	
	$('button#clearTerm').on("mouseup", function (e) {
		$( "#searchTerm")[0].value='';
		 searchHistory([''],false,false,true,false);
	});

    $(document).on('input', ".item_table tbody .select input[type='checkbox']", function () {
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
		
					async function del() {
							if(chkd.length>0){
								await new Promise(function(resolve, reject) {
									var count=0;
									for (let i=0; i<chkd.length; i++) {
											chrome.history.deleteUrl({
												url: chkd[i].value
											}, function(){
												count++;
												if(count==chkd.length){
												resolve();
												}
											});
									}
							}).then((result) => {;}).catch((result) => {;});
						}
				}
				
				async function opn() {
					if(chkd.length>0){
								await new Promise(function(resolve, reject) {
									var count=0;
									for (let i=0; i<chkd.length; i++) {
											chrome.tabs.create({
												url: chkd[i].value,
												active: false		
											}, function(tab){
												count++;
												if(count==chkd.length){
													resolve();
												}
											});
									}
							}).then((result) => {;}).catch((result) => {;});
						}
				}

if(chkd.length>=1){
		if(e.target.id==='removeHistory'){
			var chk=true;
				if(chkd.length>1){
					chk = confirm("Are you sure you want to delete multiple entries?");
				}
				
			if(chk){
				del();
			}
		}else if(e.target.id==='openLinks'){
							opn();
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
		}	
							
				$('button#removeHistory').prop('checked', false).closest('tr.item').hide();
									
				items = $("#" + recordType + "Container tr.item input[name='" + recordType + "[]']");
				
				if ($('button#removeHistory').is(":checked")) {
					items.prop('checked', true);
				}else{
					items.prop('checked', false);
				}
				
				updateRemoveButton(recordType);
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
		$('hr#divider')[0].style.setProperty( 'position','absolute' );
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
		   $('hr#divider')[0].style.setProperty( 'position','absolute' );
		   let tp=Math.max(e.pageY,chkRct.top);
		   $('hr#divider')[0].style.setProperty( 'top',(tp+2)+'px' );
		  chk.style.setProperty( 'height',Math.max(0,tp-chkRct.top-$('hr#divider')[0].clientHeight-4)+'px' );
		   overDivd.top=$('hr#divider')[0].getBoundingClientRect().top;
	   }
    });	
	
	$(document).on("mouseup", function (e) {
       overDivd.over=(overDivd.over)?false:overDivd.over;
    });
	
chrome.history.onVisitRemoved.addListener(function(removed){
					$("#searchTerm")[0].value='';
					$("input#allHistories")[0].checked=false;
	searchHistory([''],true,false,true,true);
});
	
chrome.history.onVisited.addListener(function(Historyitem){
					$("#searchTerm")[0].value='';
					$("input#allHistories")[0].checked=false;
	searchHistory([''],true,false,true,true);
});

});