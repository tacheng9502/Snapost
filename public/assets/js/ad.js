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
                var clickCount;
                var sponsorName = data.val().sponsorName;
                (data.val().clickCount.totalClick == null) ? (clickCount = 0) : (clickCount = data.val().clickCount.totalClick);
                adHtml += '<tr>\
                            <td>' + name + '</td>\
                            <td>' + clickCount + '</td>\
                            <td>' + sponsorName + '</td>\
                            <td><button id="' + name + '_mod" type="button" class="btn btn-primary" href="#" onclick="clickModify(event)">編輯</button></td>\
                            <td><button id="' + name + '_del" type="button" class="btn btn-default" href="#" onclick="clickDelete(event)">刪除</button></td>\
                            </tr>';
            });
            $("#list").append(adHtml);
        });
    }

    $('#writeNewPost').on('click', function(event) {
        event.preventDefault();
        var adId = $('#newAd_id').val();
        var adName = $('#newAd_name').val();
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
            advertTitle: adName,
            postBody: adBody,
            sponsorName: adSponsor,
            sponsorUrl: adUrl,
        };
        sets['/adverts/' + adId] = data;
        if(firebase.database().ref().update(sets)){
            var click = {};
            click['/adverts/' + adId + '/clickCount/totalClick'] = 0;
            firebase.database().ref().update(click);
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
            $("#ad_preview").empty().append(img);
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
            $("#sp_preview").empty().append(img);
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

    window.clickModify = function(event) {
        event.preventDefault();
        var refKey = event.target.id.slice(0, -4);
        var adDetailRef = firebase.database().ref('adverts/' + refKey + '/');
        $("#adDetail").removeAttr("hidden");
        adDetailRef.once('value', function(data) {
            var title = data.val().advertTitle;
            var body = data.val().postBody;
            var adImg = data.val().postImage;
            var sponName = data.val().sponsorName;
            var sponImg = data.val().sponsorImage;
            var sponUrl = data.val().sponsorUrl;
            $("#ad_title").empty().append(title);
            $("#ad_body").empty().append(body);
            $("#ad_spon").empty().append(sponName);
            $("#ad_sponurl").empty().append(sponUrl);
            $("#curAd").empty().attr("src", adImg);
            $("#curSp").empty().attr("src", sponImg);
        })
    }

    window.sendUpdate = function(event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -4);
        var title = $("#ad_title").val();
        var body = $("#ad_body").val();
        var sponName = $("#ad_spon").val();
        var sponUrl = $("#ad_sponurl").val();
        var downloadURL1 = null;
        var downloadURL2 = null;
        var updates = {};
        if (newImageFile1 != null) {
            newImageFile1.croppie('result', {
                type: 'blob',
                size: {
                    width: 600,
                    height: 600
                },
                format: 'jpeg'
            }).then(function(resp) {
                var uploadTask = firebase.storage().ref().child('postImage/' + postKey).put(resp, metadata);
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
                        downloadURL1 = uploadTask.snapshot.downloadURL;
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
                var uploadTask = firebase.storage().ref().child('postImage/' + newPostKey).put(resp, metadata);
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
                        downloadURL2 = uploadTask.snapshot.downloadURL;
                    });
            });
        };

        var updates = {};
        (downloadURL1 == null) ? (downloadURL1 = null) : (updates['/adverts/' + postKey + '/postImage'] = downloadURL1);
        (downloadURL2 == null) ? (downloadURL2 = null) : (updates['/adverts/' + postKey + '/postImage'] = downloadURL2);
        updates['/adverts/' + postKey + '/advertTitle'] = title;
        updates['/adverts/' + postKey + '/postBody'] = body;
        updates['/adverts/' + postKey + '/sponsorName'] = sponName;
        updates['/adverts/' + postKey + '/sponsorUrl'] = sponUrl;
        
        if(firebase.database().ref().update(updates)){
            $("#adDetail").empty();
            $("#adDetail").append("<p>廣告修改成功</p>");
        }else{
            alert("You may try it later :)");
        }
    }
})
