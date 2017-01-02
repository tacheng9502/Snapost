jQuery(document).ready(function($) {
    var newImageFile1, newImageFile2;
    var listeningFirebaseRefs = [];

    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'https://snapost.herokuapp.com/';
        } else {
            startDatabaseQueries();
        }
    });

    function startDatabaseQueries() {
        var adRef = firebase.database().ref('/adverts');
        var adHtml = "";
        adRef.once('value', function(snapshot) {
            $("#list").empty();
            snapshot.forEach(function(data) {
                var name = data.key;
                var title = data.val().advertTitle;
                var clickCount;
                var sponsorName = data.val().sponsorName;
                (data.val().clickCount.totalClick == null) ? (clickCount = 0) : (clickCount = data.val().clickCount.totalClick);
                adHtml += '<tr id="' + name + '">\
                            <td>' + title + '</td>\
                            <td>' + clickCount + '</td>\
                            <td>' + sponsorName + '</td>\
                            <td class="pull-right"><button id="' + name + '_mod" type="button" class="btn btn-primary btn-sm" href="#" onclick="clickView(event)">檢視</button>&nbsp;<button id="' + name + '_del" type="button" class="btn btn-default btn-sm" href="#" onclick="clickDelete(event)">刪除</button></td>\
                            </tr>';
            });
            $("#list").append(adHtml);
        });
    }

    $('#writeNewPost').on('click', function(event) {
        event.preventDefault();
        var adId = $('#newAd_name').val();
        var adTitle = $('#newAd_name').val();
        var adBody = $('#newAd_body').val();
        var adUrl = $('#newAd_url').val();
        var adSponsor = $('#newAd_sponsorName').val();
        var metadata = {
            contentType: 'image/jpeg'
        };

        var downloadURL1 = null;
        var downloadURL2 = null;
        var sets = {};
        if (newImageFile1 != null) {
            newImageFile1.croppie('result', {
                type: 'blob',
                size: {
                    width: 600,
                    height: 600
                },
                format: 'jpeg'
            }).then(function(resp) {
                var uploadTask = firebase.storage().ref().child('adverts/' + adId + '_post').put(resp, metadata);
                uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
                    function(snapshot) {
                        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                        switch (snapshot.state) {
                            case firebase.storage.TaskState.PAUSED:
                                console.log('Upload is paused');
                                break;
                            case firebase.storage.TaskState.RUNNING:
                                console.log('Upload is running');
                                break;
                        }
                    },
                    function(error) {
                        switch (error.code) {
                            case 'storage/unauthorized':
                                // User doesn't have permission to access the object
                                break;
                            case 'storage/canceled':
                                // User canceled the upload
                                break;
                            case 'storage/unknown':
                                // Unknown error occurred, inspect error.serverResponse
                                break;
                        }
                    },
                    function() {
                        // Upload completed successfully, now we can get the download URL
                        var imgSrc = {};
                        imgSrc['/adverts/' + adId + '/postImage'] = uploadTask.snapshot.downloadURL;
                        firebase.database().ref().update(imgSrc);
                    });
            });
        };

        if (newImageFile2 != null) {
            newImageFile2.croppie('result', {
                type: 'blob',
                size: {
                    width: 600,
                    height: 600
                },
                format: 'jpeg'
            }).then(function(resp) {
                var uploadTask = firebase.storage().ref().child('adverts/' + adId + '_spon').put(resp, metadata);
                uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
                    function(snapshot) {
                        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                        switch (snapshot.state) {
                            case firebase.storage.TaskState.PAUSED:
                                console.log('Upload is paused');
                                break;
                            case firebase.storage.TaskState.RUNNING:
                                console.log('Upload is running');
                                break;
                        }
                    },
                    function(error) {
                        switch (error.code) {
                            case 'storage/unauthorized':
                                // User doesn't have permission to access the object
                                break;
                            case 'storage/canceled':
                                // User canceled the upload
                                break;
                            case 'storage/unknown':
                                // Unknown error occurred, inspect error.serverResponse
                                break;
                        }
                    },
                    function() {
                        var imgSrc = {};
                        // Upload completed successfully, now we can get the download URL
                        imgSrc['/adverts/' + adId + '/sponsorImage'] = uploadTask.snapshot.downloadURL;
                        firebase.database().ref().update(imgSrc);
                    });
            });
        };

        var data = {
            advertTitle: adTitle,
            postBody: adBody,
            sponsorName: adSponsor,
            sponsorUrl: adUrl,
        };
        sets['/adverts/' + adId] = data;
        if(firebase.database().ref().update(sets)){
            var click = {};
            click['/adverts/' + adId + '/clickCount/totalClick'] = 0;
            firebase.database().ref().update(click);
            $('#newAd_id').val("");
            $('#newAd_name').val("");
            $('#newAd_body').val("");
            $('#newAd_url').val("");
            $('#newAd_sponsorName').val("");
            $('#img_preview').empty();
            $('#sp_preview').empty();
            var htm = '<tr id="' + adId + '">\
                            <td>' + adId + '</td>\
                            <td>0</td>\
                            <td>' + adSponsor + '</td>\
                            <td><button id="' + adId + '_mod" type="button" class="btn btn-primary" href="#" onclick="clickView(event)">檢視</button></td>\
                            <td><button id="' + adId + '_del" type="button" class="btn btn-default" href="#" onclick="clickDelete(event)">刪除</button></td>\
                            </tr>'
            $("#list").append(htm);
        }else{
            alert("You may try it later :)");
        }
    });

    $("#img_input").on('click', function () {
        $('#file').trigger('click');
    });

    $("#file").on("change", function (event) {
        var reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]); // 讀取檔案
        reader.onload = function (arg) {
            var img = '<img id="ad_preview" class="preview" src="' + arg.target.result + '" alt="preview"/>';
            $("#img_preview").empty().append(img);
            newImageFile1 = $('#ad_preview').croppie({
                viewport: {
                    width: 400,
                    height: 400,
                    type: 'square'
                },
                boundary: {
                    width: 400,
                    height: 400
                }
            });
        }
    });

    $("#sp_input").on('click', function () {
        $('#spfile').trigger('click');
    });

    $("#spfile").on("change", function (event) {
        var reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]); // 讀取檔案
        reader.onload = function (arg) {
            var img = '<img id="sp_preview_c" class="preview" src="' + arg.target.result + '" alt="preview"/>';
            $("#sp_preview").empty().append(img);
            newImageFile2 = $('#sp_preview_c').croppie({
                viewport: {
                    width: 400,
                    height: 400,
                    type: 'square'
                },
                boundary: {
                    width: 400,
                    height: 400
                }
            });
        }
    });

    $("#ad_img_f").on("change", function(event) {
        var reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]); // 讀取檔案
        reader.onload = function(arg) {
            var img = '<img id="ad_img_pre" class="preview" src="' + arg.target.result + '" alt="preview"/>';
            $("#ad_preview_up").empty().append(img);
            newImageFile1 = $('#ad_img_pre').croppie({
                viewport: {
                    width: 400,
                    height: 400,
                    type: 'square'
                },
                boundary: {
                    width: 400,
                    height: 400
                }
            });
        }
    });

    $("#sp_img_f").on("change", function(event) {
        var reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]); // 讀取檔案
        reader.onload = function(arg) {
            var img = '<img id="sp_img_pre" class="preview" src="' + arg.target.result + '" alt="preview"/>';
            $("#sp_preview_up").empty().append(img);
            newImageFile2 = $('#sp_img_pre').croppie({
                viewport: {
                    width: 400,
                    height: 400,
                    type: 'square'
                },
                boundary: {
                    width: 400,
                    height: 400
                }
            });
        }
    });

    $("#edit_b").on('click', function(event) {
        var oldTitle = $("#adTitle").text();
        var oldAdBody = $("#adBody").text();
        var oldTargetUrl = $("#adTargetUrl").text();
        var ref = $("#ref").val();
        $('#edit').html(
            '<button id="' + ref + '_send" class="btn btn-default" onclick="sendUpdate(event)" >' +
            '<i id="' + ref + '_send" class="fa fa-floppy-o" onclick="sendUpdate(event)" title="save"></i></a>'
        );
        $("#adTitle").html('<textarea id="' + ref + '_newTitle" class="form-control" rows="1">' + oldTitle + '</textarea>');
        $("#adBody").html('<textarea id="' + ref + '_newAdBody" class="form-control" rows="3">' + oldAdBody + '</textarea>');
        $("#adTargetUrl").html('<textarea id="' + ref + '_newTargetUrl" class="form-control" rows="2">' + oldTargetUrl + '</textarea>');

    });

    window.clickView = function(event) {
        event.preventDefault();
        var refKey = event.target.id.slice(0, -4);
        var adDetailRef = firebase.database().ref('adverts/' + refKey + '/');
        $("#adDetail").removeAttr("hidden");
        adDetailRef.once('value', function(data) {
            var title = data.val().advertTitle;
            var body = data.val().postBody;
            var adImg = data.val().postImage;
            var sponUrl = data.val().sponsorUrl;
            var sponName = data.val().sponsorName;
            var sponImg = data.val().sponsorImage;
            $("#ref").val(data.key);
            $("#sponImg").attr("src", sponImg);
            $("#adTitle").empty().append(title);
            $("#adBody").empty().append(body);
            $("#adImg").attr("src", adImg);
            $("#adTargetUrl").empty().append(sponUrl);
            $("#ref").empty().attr("value", refKey);
        })
    }

    window.clickDelete = function(event) {
        event.preventDefault();
        var refKey = event.target.id.slice(0,-4);
        var ref = "#"+refKey;
        swal({
                title: "確認刪除廣告?",
                text: "刪除後廣告將無法復原",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "刪除",
                closeOnConfirm: false
            },
            function () {
                var deletes = {};
                deletes['/adverts/' + refKey] = null;
                firebase.database().ref().update(deletes);
                swal("已刪除", "留言已經成功刪除", "success");
                $(ref).remove();
            });
    }

    window.sendUpdate = function(event) {
        event.preventDefault();
        var postKey = $("#ref").val();
        var body = $("#" + postKey + "_newAdBody").val();
        var title = $("#" + postKey + "_newTitle").val();
        var sponUrl = $("#" + postKey + "_newTargetUrl").val();

        var updates = {};
        updates['/adverts/' + postKey + '/advertTitle'] = title;
        updates['/adverts/' + postKey + '/postBody'] = body;
        updates['/adverts/' + postKey + '/sponsorUrl'] = sponUrl;

        if(firebase.database().ref().update(updates)){
            alert("修改完畢");
            $("#sponImg").attr("src", "");
            $("#adTitle").empty();
            $("#adBody").empty();
            $("#adImg").attr("src", " ");
            $("#adTargetUrl").attr("href", " ");
            $("#adTargetUrl").empty();
            $("#ref").empty().attr("value", " ");
            $("#adDetail").attr("hidden", "hidden");
            $('#edit').html('<button id="edit_b" class="btn btn-default" onclick="">'+
                            '<i id="edit_i" class="fa fa-pencil" onclick="" title="edit"></i>'+
                            '</button>');
        }else{
            alert("You may try it later :)");
        }
    }
})
