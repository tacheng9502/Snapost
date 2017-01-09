jQuery(document).ready(function ($) {
    $("#userInfo").hide();
    $(".dashboard-menu").show();

var totalpost=0;
    function createAdBar(array,adName){
        $('#ad').append('<div id='+adName+'></div>');
        var chart = c3.generate({
            bindto: '#'+adName,
            data: {
                x : 'x',
                columns: [

                ],
                type: 'bar'
            },bar: {
                width: {ratio: 0.2 }
            },axis: {
                x: {
                    type: 'category',
                    }
            },size:{
                width:1200
            }
        });
        for(var i=0;i<array.length;i++){
            chart.load({
                columns:[
                    [array[i].time.toString(),array[i].count],
                    ['x',adName]
                ]
            });
        };

    }



    function createBar(array){
        var chart = c3.generate({
            bindto: '#usercount',
            data: {
                x : 'x',
                columns: [

                ],
                type: 'bar'
            },bar: {
                width: {ratio: 0.2 }
            },axis: {
                x: {
                    type: 'category',
                    }
                },size:{
                width:1200
            }
        });
        for(var i=0;i<array.length;i++){
            chart.load({
                columns:[
                    [array[i].time.toString(),array[i].userCount],
                    ['x',"每月新進人數"]
                ]
            });
        };

    }

    function createspline(array){
        var total=0;
        var arr=[];
        var arr1=[];
        var xarr=[];
        arr[0]="累計貼文數"
        arr1[0]="單月貼文數"
        xarr[0]="x"
        var chart = c3.generate({
            bindto: '#post',
             data: {
        x : 'x',
        columns: [

        ],
        type: 'spline'
        },axis: {
                x: {
                    type: 'category',
                    }
                },size:{
                width:1200
            }
        });
        for(var i=0;i<array.length;i++){
            total=total+array[i].postCount;
            arr.push(total);
            arr1.push(array[i].postCount);
            xarr.push(array[i].time.toString());
        };
        chart.load({
            columns:[
                arr,
                arr1,
                xarr
            ],
            axes: {
                累計貼文數: 'y',
                單月貼文數: 'y2'
            },types:{單月貼文數:'bar'},
        });
    }

    firebase.database().ref('statistic').once("value", function (snapshot){
        var array = [];
        snapshot.forEach(function(data){
            var post = {
                    time: data.key,
                    postCount: data.val().postCount,
                    userCount: data.val().userCount,
                };
                array.push(post);
        });
        createspline(array);
        createBar(array);
    });
        firebase.database().ref('adverts').once("value", function (snapshot){
        snapshot.forEach(function(data){
            var adKey= data.key;
            var array = [];
            firebase.database().ref('adverts/'+adKey+'/clickCount').once("value", function (snapshot){
                snapshot.forEach(function(data){
                    var post = {
                        time: data.key,
                        count: data.val(),
                    };
                    array.push(post);
                });
                    createAdBar(array,adKey);
            });
        });

    });

});
