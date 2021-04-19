/*@author : arrenzhang
 *@email : arrenzhang@qq.com 
 *@version : 0.5.1
 *@summary : Helps creating a timeline component on web page, and users could choose a timestamp on that timeline by clicking with mouse left button.
 ****/
var Timeline=function(elID,
        attrs /* { time:millis,days:nnn,hours:nnn,mark_time:true|false,mark_selected:true|false,limit:true|false,animate:true|false,time_limit:millis} */,
        callbacks /* { onDateSelected,onTimeSelected }*/)
{
var this_=this;    
var
element=$(document.getElementById(elID)),props=attrs||{},cbs=callbacks||{};
var
element_days,element_hours;
var
container_width,container_height;
var
animation_timeout=typeof(props["animate"])!=="undefined" && true!==props["animate"] ? 0 : 250;
var
limit_on_select=typeof(props["limit"])!=="undefined" && true===props["limit"]; /* will not display times exceed this given point */
var
time_end_limit=typeof(props["time_limit"])!=="undefined" ? parseInt(props["time_limit"]) : 0; /* limited end time of timeline */

var
nop=function()
{},
query_size=function()
{
    container_width = element.width();
    container_height = element.height();
},
on_container_size_changed=function()
{
    query_size();
    if( element_days ) 
        element_days_resize();
    if( element_hours )
        element_hours_resize();
},
init0=function()
{
    $(window).on("resize",on_container_size_changed);
    query_size();
    
    if( typeof(props["days"])!=="undefined" ){
        element_days=$("<div class='days'></div>").appendTo(element);
        element_days_init(parseInt(props["time"]),parseInt(props["days"]));    
    }
    else
    {
        element_hours_create_panel();
        element_hours_init(parseInt(props["time"]),parseInt(props["hours"]||"8"));
    }
};
var
same_date=function(a,b){
	return a.getFullYear()===b.getFullYear()
		&& a.getMonth()===b.getMonth()
		&& a.getDate()===b.getDate();
},
same_hour=function(a,b){
	return same_date(a,b)
		&& a.getHours()===b.getHours();
},
checkDateScope=function(start,days)
{
    var end = start+days*24*3600*1000;
    var limit = time_end_limit ? time_end_limit : new Date().getTime();
    if( end>limit ){
        start = limit-(days-1)*24*3600*1000;
    }
    return [start,days];
},
checkTimeScope=function(start,hours)
{
    var end = start+hours*3600*1000;
    var limit_date = time_end_limit ? new Date(time_end_limit) : new Date();
    var limit = limit_date.getTime();
    if( end>limit ){
        limit_date.setMinutes(0);
        limit_date.setSeconds(0);
        limit_date.setMilliseconds(0);
        start = limit_date.getTime()-(hours-1)*3600*1000;
    }
    return [start,hours];
}
;


var
element_days_init=function(start,days)
{
    var scope = limit_on_select
			? checkDateScope(start,days) 
			: [start,days];	
    var cell_width=Math.floor(container_width/scope[1]), space = container_width-cell_width*scope[1], padding_start=Math.floor(space/2), padding_end=space-padding_start;
        element_days.attr({"padding-start":padding_start,"padding-end":padding_end});		
    var ts = scope[0], x=0, lbs=[], dts=[], today=new Date();
    for(var n=scope[1],i=0;i<n;i++)
	{
        var dt=new Date(ts);
        var day=dt.getDate();
        var e=$("<div class='day'></div>").appendTo(element_days);
		var width=cell_width+(i===0?padding_start:i===n-1?padding_end:0);
        e.css({"left":x,"width":width,"height":container_height,"line-height":container_height+"px"});
        e.append($("<div class='day_value'></div>").html(day)).attr("timestamp",ts);
		x += width;
        ts += 24*3600*1000;
        e.attr("timestamp_end",ts);
		if( same_date(today,dt) ){ e.addClass('current'); }
        if( i===0 || day===1 ){ lbs.push(e); dts.push(dt); }
    }
    element_days_labels( lbs,dts );
    element_days.on("mousewheel DOMMouseScroll",element_days_on_scroll);
    element_days.children("div.day").on("click",element_days_on_selected);
},
element_days_labels=function(lbs,dts)
{
    for(var i in lbs){
        var e=lbs[i];
        var dt=dts[i],year=dt.getFullYear(),month=dt.getMonth()+1,month_string=month<10?"0"+month:month;
        var lb=$("<div class='day_label'></div>").appendTo(e);
        e.addClass("labeled");
        lb.append($("<div class='year'></div>").html(year)).append($("<div class='month'></div>").html(month_string));
    }
},
element_days_resize=function()
{
    var els=element_days.children("div.day");
    var days=els.length;
    var cell_width=Math.floor(container_width/days), space = container_width-cell_width*days, padding_start=Math.floor(space/2), padding_end=space-padding_start;
        element_days.attr({"padding-start":padding_start,"padding-end":padding_end});
    var x=0;
    for(var n=els.length,i=0;i<n;i++)
	{
        var e=$(els.get(i));
		var width=cell_width+(i===0?padding_start:i===n-1?padding_end:0);
        e.css({"left":x,"width":width,"height":container_height,"line-height":container_height+"px"});
		x += width;
    }
},
element_days_on_zoom=function(event,step)
{
    var els=element_days.children("div.day");
    var days=els.length;
    var days_new = days+step;
    if( days_new!==days && days_new>0 && days_new<=32 )
    {
		var first=$(els.get(0));
		
		var target=element_days,one=target.get(0);
		var offset=event.clientX-(one.clientLeft||one.offsetLeft);
				
		var fst_ts = parseInt(first.attr("timestamp"));		
		var start;
		
		if( step<0 )/* zoom in */{
			start = offset<target.width()/2 ? fst_ts : fst_ts+24*3600*1000;
		} else {
			start = offset<target.width()/2 ? fst_ts : fst_ts-24*3600*1000;
		}
			
        element_days.remove();
        element_days=$("<div class='days'></div>").appendTo(element);
		element_days_init( start,days_new );
    }
},
element_days_on_scroll=function(event)
{
    event.preventDefault();
	
    var evt=event.originalEvent;
    var delta = Math.max(-1,Math.min(1,(evt.wheelDelta||-evt.detail)));    
	
	if( evt.ctrlKey && !(evt.shiftKey || evt.altKey)){ /* zoom in out */
		element_days_on_zoom( event,delta );
	}
	else{
		var els=element_days.children("div.day");
		var days=els.length;
		var start = parseInt(els.get(0).getAttribute("timestamp"))+(delta<0?1:-1)*(evt.shiftKey?2:1)*(evt.altKey?4:1)*(evt.ctrlKey?16:1)*24*3600*1000;    
		var scope = limit_on_select ? checkDateScope(start,days) : [start,days];
		
		element_days_adjust_each(scope[0],els);
	}
},
element_days_adjust_each=function(start,els)
{
    var ts = start, lbs=[],dts=[], today=new Date();
    for(var n=els.length,i=0;i<n;i++)
	{
        var dt=new Date(ts);
        var day=dt.getDate();
        var e=$(els.get(i));
		e.empty().removeClass("labeled current").append($("<div class='day_value'></div>").html(day)).attr("timestamp",ts);
        ts += 24*3600*1000;
        e.attr("timestamp_end",ts);
		if( same_date(today,dt) ){ e.addClass('current'); }
        if( i===0 || day===1 ){ lbs.push(e); dts.push(dt); }
    }
    element_days_labels( lbs,dts );
},
element_days_on_selected=function(event)
{
    var current=parseInt($(this).attr("timestamp"));
    (cbs["onDateSelected"]||nop).apply(this_,[current]);
    
    if( typeof(props["hours"])!=="undefined" && !isNaN(props["hours"]) ) /* will display hours-panel on screen */
    {
        element_days.hide(animation_timeout);
        element_hours_create_panel();
        element_hours_init(current,parseInt(props["hours"])); 
    }
};


var hours_history_time;
var hours_marked;
var
element_hours_create_panel=function()
{
    element_hours=$("<div class='hours'></div>").appendTo(element);
    return element_hours;
},
element_hours_init=function(start,hours)
{
    if( typeof(props["mark_time"])!=="undefined" && props["mark_time"]===true ){ /* mark initial timestamp on timeline ? */
        delete props["mark_time"]; /* we don't mark it everytime this component is shown ! */
        hours_marked = parseInt(props["time"]);
    }   
    
    var target_dt=new Date(start);
    var marked;
    
    if( hours_marked )
	{
        var dt = new Date(hours_marked);
        if( dt.getFullYear()===target_dt.getFullYear() 
            && dt.getMonth()===target_dt.getMonth()
            && dt.getDate()===target_dt.getDate() )
        {
            target_dt.setHours(dt.getHours());
            target_dt.setMinutes(0);
            target_dt.setSeconds(0);
            target_dt.setMilliseconds(0);
            marked = true; 
        }
    }
    if( marked ) /* start time been adjusted already, nothing more to do here */
	{}
    else if( hours_history_time ){
        var dt = new Date(hours_history_time);
        target_dt.setHours(dt.getHours());
        target_dt.setMinutes(0);
        target_dt.setSeconds(0);
        target_dt.setMilliseconds(0);
    }
    else{
        target_dt.setHours(0);
        target_dt.setMinutes(0);
        target_dt.setSeconds(0);
        target_dt.setMilliseconds(0);
    }
    element_hours_init_render( target_dt.getTime(),hours );
},
element_hours_init_render=function(start,hours)
{
    var scope = limit_on_select
			? checkTimeScope(start,hours)
			: [start,hours];  
    var cell_width=Math.floor(container_width/scope[1]), space = container_width-cell_width*scope[1], padding_start=Math.floor(space/2), padding_end=space-padding_start;
        element_hours.attr({"padding-start":padding_start,"padding-end":padding_end});
		
    var ts=scope[0], x=0,lbs=[],dts=[], today=new Date();
    for(var n=scope[1],i=0;i<n;i++)
	{
        var dt=new Date(ts);
        var hour=dt.getHours(),minute=dt.getMinutes();
        var label=(hour>9 ? hour : "0"+hour)+":"+(minute>9 ? minute : "0"+minute);
		var width=cell_width+(i===0?padding_start:i===n-1?padding_end:0);
        var e=$("<div class='hour'></div>").appendTo(element_hours);
        e.css({"left":x,"width":width,"height":container_height,"line-height":container_height+"px"});
        e.append($("<div class='hour_value'></div>").html(label).css("padding-left",i===0?padding_start:0)).attr("timestamp",ts);
		x += width;
        ts += 3600*1000;
        e.attr("timestamp_end",ts);
		if( same_hour(today,dt) ){ e.addClass('current'); }
        if( i===0 || hour===0 ){ lbs.push(e); dts.push(dt); }
    }
    element_hours_labels( lbs,dts,today ); /* display year-month-day label on first hour of every day */
    
    element_hours.append($("<div class='hours_anchor'></div>").css("left",-900));
    var anch = $("<div class='hours_current'></div>").css({"left":-900}).appendTo(element_hours);
        anch.css({"top":container_height-anch.height()});
    
    if( typeof(props["mark_selected"])!=="undefined" && true===props["mark_selected"] )
	{
        element_hours.append($("<div class='hours_mark'></div>").css("left",-900));
        var marked=$("<div class='hours_mark_value'></div>").css({"left":-900}).appendTo(element_hours);
            marked.css({"top":container_height-marked.height()});
    } 
    element_hours_display_marked();
    
    element_hours.on("mouseleave",function(event){$("div.hours_current",element_hours).css({"left":-900});});
    element_hours.on("mousewheel DOMMouseScroll",element_hours_on_scroll).on("mousemove",element_hours_on_mouse_move);
    element_hours.on("click",element_hours_on_click).on("contextmenu",function(event){element_hours_back(event);return false;});
},
element_hours_labels=function(lbs,dts,today)
{
    for(var i in lbs)
	{
        var e=lbs[i];
        var dt=dts[i],year=dt.getFullYear(),month=dt.getMonth()+1,date=dt.getDate();
        var label=(year)+"-"+(month>9 ? month : "0"+month)+"-"+(date>9 ? date : "0"+date);
        var el = $("<div class='hour_label'></div>").html(label).appendTo(e);
        e.addClass("labeled");
		if( same_date(today,dt) ){ el.addClass("current"); }
    }
},
element_hours_resize=function()
{
    var els=element_hours.children("div.hour");
    var hours=els.length;
    var cell_width=Math.floor(container_width/hours), space = container_width-cell_width*hours, padding_start=Math.floor(space/2), padding_end=space-padding_start;
        element_hours.attr({"padding-start":padding_start,"padding-end":padding_end});
    var x=0;
    for(var n=els.length,i=0;i<n;i++){
		var width=cell_width+(i===0?padding_start:i===n-1?padding_end:0);
        var e=$(els.get(i));
		e.css({"left":x,"width":width,"height":container_height,"line-height":container_height+"px"});
		e.children("div.hour_value").css("padding-left",i===0?padding_start:0);
		x += width;
    }
    element_hours_display_marked();
},
element_hours_on_zoom=function(event,step) /* we created new component-for-hours when been zoomed */
{
    var els=element_hours.children("div.hour");
    var hours=els.length;
    var hours_new = hours+step;
    if( hours_new!==hours && hours_new>0 && hours_new<=24 )
    {
		var first=$(els.get(0)), last = $(els.get(els.length-1));

		var cur=$("div.hours_current",element_hours);
		var cur_ts=cur.attr('timestamp');
		var selected = cur_ts 
				? parseInt(cur_ts)
				: parseInt(first.attr("timestamp"));
				
		var fst_ts = parseInt(first.attr("timestamp"));		
		var start;
		
		if( step<0 )/* zoom in */{
			start = selected<(parseInt(first.attr("timestamp"))+parseInt(last.attr("timestamp_end")))/2
				? fst_ts
				: fst_ts+3600*1000;
		} else { /* zoom out */
			start = selected<(parseInt(first.attr("timestamp"))+parseInt(last.attr("timestamp_end")))/2
				? fst_ts
				: fst_ts-3600*1000;
		}
		
		var dt = new Date( start );
			dt.setMinutes(0);
			dt.setSeconds(0);
			dt.setMilliseconds(0);
			
        element_hours.remove(); /* destroy old hours-panel, and will create new panel on page */
        element_hours_create_panel();
		element_hours_init_render( dt.getTime(),hours_new );
    }
},
element_hours_on_scroll=function(event)
{
    event.preventDefault();
	
    var evt = event.originalEvent;
    var delta = Math.max(-1,Math.min(1,(evt.wheelDelta||-evt.detail)));
	
	if( evt.ctrlKey && !(evt.shiftKey || evt.altKey)){ /* zoom in out */
		element_hours_on_zoom( event, delta );
	}
	else{ /* navigate on time */
		var els=element_hours.children("div.hour");
		var hours=els.length;
		var start = parseInt(els.get(0).getAttribute("timestamp"))+(delta<0?1:-1)*(evt.shiftKey?2:1)*(evt.altKey?4:1)*(evt.ctrlKey?16:1)*3600*1000;
		var scope = limit_on_select ? checkTimeScope(start,hours) : [start,hours];  
		element_hours_adjust_each(scope[0],els);
		element_hours_display_marked();
	}
	element_hours_on_mouse_move( event,null,null,null,element_hours ); /* triggers an mouse-move event for displaying time of where mice located */
},
element_hours_adjust_each=function(start,els)
{
    var lbs=[],dts=[], today=new Date();
    var ts=start;
    for(var n=els.length,i=0;i<n;i++)
	{
        var dt=new Date(ts);
        var hour=dt.getHours(),minute=dt.getMinutes();
        var label=(hour>9 ? hour : "0"+hour)+":"+(minute>9 ? minute : "0"+minute);
        var e=$(els.get(i));
		e.empty().removeClass("labeled current").append($("<div class='hour_value'></div>").html(label)).attr("timestamp",ts);
        ts += 3600*1000;
        e.attr("timestamp_end",ts);
		if( same_hour(today,dt) ){ e.addClass('current'); }
        if( i===0 || hour===0 ){ lbs.push(e); dts.push(dt); }
    }
    element_hours_labels( lbs,dts,today );
},
element_hours_time_on_mouse=function(event,target,position)
{
	var padding_start = parseInt(target.attr("padding-start"));
	var width = target.width()-padding_start-parseInt(target.attr("padding-end"));
	var offset = position-padding_start;
    var all=target.children("div.hour"), first=$(all.get(0)), last=$(all.get(all.length-1));
    var start=parseInt(first.attr("timestamp"));
    var end=parseInt(last.attr("timestamp_end"));
    return Math.round(start+offset*(end-start)/width );
},   
element_hours_on_mouse_move=function(event,a,b,c,target_might)
{
    var target=target_might ? target_might : $(this), one=target.get(0);
    var offset=event.clientX-(one.clientLeft||one.offsetLeft);
    var current = element_hours_time_on_mouse(event,target,offset);
    
    var dt=new Date(current), now=new Date();
    var label = format2ts(dt);
    var position = offset;
    var width = target.width();
    var el = $("div.hours_current",element_hours);
        el.html(label).attr("timestamp",current);
        el.css({"left":position<width/2?position:position-el.width()-4});
    var an = $("div.hours_anchor",element_hours);
        an.css("left",position-an.width()/2);
        
    if( dt>now )
	    element_hours.addClass("over");
	else
	    element_hours.removeClass("over");    
},    
element_hours_back=function()/* right-click, will display panel for days */
{
    if( typeof(props["days"])!=="undefined" && element_days )
    {
        hours_history_time = parseInt(element_hours.children("div.hour").attr("timestamp"));
        element_hours.remove();
        element_days.show(animation_timeout);
    }
},
element_hours_display_marked=function()
{
    if( hours_marked )
    {
        var target = element_hours;
        var all=target.children("div.hour"), first=$(all.get(0)), last=$(all.get(all.length-1));
        var start=parseInt(first.attr("timestamp"));
        var end=parseInt(last.attr("timestamp_end"));
		var each=(end-start)/all.length;
        if( hours_marked>start-each && hours_marked<end+each )
        {
			var padding_start = parseInt(target.attr("padding-start"));
            var width = target.width()-padding_start-parseInt(target.attr("padding-end"));
            var offset=(hours_marked-start)*width/(end-start);
            var position = offset+padding_start; /* offset plus start-padding */
            var mark = $("div.hours_mark",element_hours);
                mark.css({"left":position-mark.width()/2});
            var markv = $("div.hours_mark_value",element_hours);
                markv.html(format2ts(new Date(hours_marked)));
                markv.css({"left":position<width/2?position:position-markv.width()-4});
        }
        else
        {
            $("div.hours_mark,div.hours_mark_value",element_hours).css({"left":-900}); /* make it invisible for MARK component */
        }    
    }
},
element_hours_on_click=function(event)
{
    if( event.which===1 ) /* choose timestamp at given point by clicking with left-button */
    {
		var target=$(this),one=target.get(0);
		var offset=event.clientX-(one.clientLeft||one.offsetLeft);
		var current = element_hours_time_on_mouse(event,target,offset);
		
		if( typeof(props["mark_selected"])!=="undefined" && props["mark_selected"]===true ){
			hours_marked = current;
		}
		element_hours_display_marked();
		
		(cbs["onTimeSelected"]||nop).apply(this_,[current]);
    }
    else if( event.which===3 && element_days ) /* right-click ? go back to days-panel */
    {
        element_hours_back(event);
    }
};
var format2ts=function(dt)
{    
    var year = dt.getFullYear(),month=dt.getMonth()+1,date=dt.getDate();
    var hour = dt.getHours(),minute=dt.getMinutes(),second=dt.getSeconds();    
    var label = 
            (year)+"-"+(month>9 ? month : "0"+month)+"-"+(date>9 ? date : "0"+date)
            +" "
            +(hour>9 ? hour : "0"+hour)+":"+(minute>9 ? minute : "0"+minute)+":"+(second>9 ? second : "0"+second);
    return label;
};

this.destroy=function() /* after invoked this method, you SHOULD WILL NOT do anything with this object ! */
{
    if( element_days ){
        element_days.remove();
        element_days = null;
    }
    if( element_hours ){
        element_hours.remove();
        element_hours = null;
    }
};

init0(); };
