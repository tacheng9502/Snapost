jQuery(document).ready(function($) {
    var newImageFile;
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
                (data.val().clickCount == null) ? (clickCount = 0) : (clickCount = data.val().clickCount);
                adHtml += '<tr>\
                            <td>' + name + '</td>\
                            <td>' + clickCount + '</td>\
                            <td>' + sponsorName + '</td>\
                            <td><button id="' + name + '_mod" type="button" class="btn btn-primary">編輯</button></td>\
                            <td><button id="' + name + '_del" type="button" class="btn btn-default">刪除</button></td>\
                            </tr>';
            });
            $("#list").append(adHtml);
        });
    }

    $('#clearNewPost').on('click', function(event) {
        event.preventDefault();
        $('#newPost_body').val("");
        $("#img_preview").empty();
        newImageFile = null;
    });

    $('#writeNewPost').on('click', function(event) {
        event.preventDefault();
        var adName = $('#newAd_name').val();
        var adBody = $('#newAd_body').val();
        var adUrl = $('#newAd_url').val();
        var adSponsor = $('#newAd_sponsorName').val();
        var metadata = {
            contentType: 'image/jpeg'
        };

        newImageFile.croppie('result', {
            type: 'blob',
            size: {
                width: 600,
                height: 600
            },
            format: 'jpeg'
        }).then(function(resp) {
            var uploadTask = firebase.storage().ref().child('adverts/' + adName).put(resp, metadata);
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
                    var downloadURL = uploadTask.snapshot.downloadURL;
                    // A post entry.
                    var postData = {
                        postBody: adBody,
                        postImage: downloadURL,
                        sponsorUrl: adUrl,
                        sponsorName: adSponsor
                    };

                    var sets = {};
                    sets['/adverts/' + newPostKey] = postData;
                    firebase.database().ref().update(sets);
                    $('#newAd_name').val("");
                    $('#newAd_body').val("");
                    $('#newAd_url').val("");
                    $('#newAd_sponsorName').val("");
                    $("#img_preview").empty();
                    newImageFile = null;
                });
        });
    });

    window.dragHandler = function(e) {
        e.stopImmediatePropagation(); //防止瀏覽器執行預設動作
        e.preventDefault();
    }

    window.dropImage = function(e) {
        e.stopImmediatePropagation(); //防止瀏覽器執行預設動作
        e.preventDefault();
        var reader = new FileReader();
        reader.readAsDataURL(e.dataTransfer.files[0]); // 讀取檔案
        // 渲染至頁面
        reader.onload = function(arg) {
            var img = '<img class="preview" src="' + arg.target.result + '" alt="preview"/>';
            $("#img_preview").empty().append(img);
            newImageFile = $('.preview').croppie({
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
    }
})
