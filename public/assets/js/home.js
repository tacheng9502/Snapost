jQuery(document).ready(function ($) {
    var newImageFile, userName, userImage, currentUserId;
    var listeningFirebaseRefs = [];

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            currentUserId = user.uid;
            userName = user.displayName;
            userImage = user.photoURL;
            $('#intro').attr("hidden", true);
            $('#content').removeAttr("hidden");
            $('#userInfo').html(
                '<img src="' + userImage + '" class="img-circle" width="30px">&nbsp;&nbsp;' +
                '<span>' + userName + '</span>'
            );
            startDatabaseQueries();
        } else {
            currentUserId = null;
            userName = null;
            userImage = null;
            $('#intro').removeAttr("hidden");
            $('#content').attr("hidden", true);
            listeningFirebaseRefs.forEach(function (ref) {
                ref.off();
            });
            listeningFirebaseRefs = [];
        }
    });

    $('#facebookLogin').on('click', function (event) {
        event.preventDefault();
        var provider = new firebase.auth.FacebookAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function (result) {
            var token = result.credential.accessToken;
            var user = result.user;
        }).catch(function (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;
            var credential = error.credential;
            console.log(errorCode);
        });
    })

    function startDatabaseQueries() {

        var postsRef = firebase.database().ref('posts').limitToLast(50);
        postsRef.on('child_added', function (data) {
            var html = createPostElement(data.key, data.val().userId, data.val().userName, data.val().userImage, data.val().postBody, data.val().postTime, data.val().postImage, data.val().likeCount);
            $('#list').append(html);
        });
        postsRef.on('child_changed', function (data) {
            $('#' + data.key + '_body').text(data.val().postBody);
        });
        postsRef.on('child_removed', function (data) {
            $('#' + data.key).remove();
        });

        listeningFirebaseRefs.push(postsRef);
    }

    function createPostElement(postKey, userId, userName, userImage, postBody, postTime, postImage, likeCount) {

        var date = new Date(parseInt(postTime));
        if (currentUserId === userId) {
            var html =
                '<li id="' + postKey + '">' +
                '<div class="info">' +
                '<a id="' + postKey + '_profile" href="/profile?u=' + userId + '" >' +
                '<img id="' + postKey + '_userImage" src="' + userImage + '" class="img-circle" width="25px">' +
                '<h2 id="' + postKey + '_userName">' + userName + '</h2>' +
                '</a>' +
                '<span id="' + postKey + '_postTime" class="time">' + date.getFullYear().toString() + '/' + (date.getMonth() + 1).toString() + '/' + date.getDate().toString() + ' ' + date.getHours().toString() + ':' + date.getMinutes().toString() + '</span>' +
                '<div id="' + postKey + '_operate" class="navi pull-right">' +
                '<button id="' + postKey + '_update" class="btn btn-default" onclick="clickUpdate(event)" >' +
                '<i id="' + postKey + '_update" class="fa fa-pencil" onclick="clickUpdate(event)" title="edit"></i>' +
                '</button>&nbsp;' +
                '<button id="' + postKey + '_delete" class="btn btn-default" onclick="clickDelete(event)" >' +
                '<i id="' + postKey + '_delete" class="fa fa-trash" onclick="clickDelete(event)" title="delete"></i>' +
                '</button>' +
                '</div>' +
                '</div>' +
                '<p id="' + postKey + '_body">' + postBody + '</p>' +
                '<img id="' + postKey + '_postImage" class="postImage" src="' + postImage + '"/>' +
                '<div class="postMenu"><button id="' + postKey + '_like" class="btn btn-link" onclick="" >' +
                '<i id="' + postKey + '_like" class="fa fa-heart-o fa-fw" onclick="clickLike(event)">&nbsp' + likeCount + '</i></button></div>' +
                '<ul id="' + postKey + '_commentList" class="comment"></ul>' +
                '<div class="msg-input"><div class="input-group">' +
                '<input id="' + postKey + '_commentBody" type="text" class="form-control" placeholder="留言...">' +
                '<span class="input-group-btn">' +
                '<button id="' + postKey + '_comment" class="btn btn-primary" onclick="writeNewComment(event)" type="button"><i class="fa fa-paper-plane fa-fw" aria-hidden="true"></i>&nbsp;發送</button>' +
                '</span>' +
                '</div></div>' +
                '</li>';
        } else {
            var html =
                '<li id="' + postKey + '">' +
                '<div class="info">' +
                '<a id="' + postKey + '_profile" href="/profile?u=' + userId + '" >' +
                '<img id="' + postKey + '_userImage" src="' + userImage + '" class="img-circle" width="25px">' +
                '<h2 id="' + postKey + '_userName">' + userName + '</h2>' +
                '</a>' +
                '<span id="' + postKey + '_postTime" class="time">' + date.getFullYear().toString() + '/' + (date.getMonth() + 1).toString() + '/' + date.getDate().toString() + ' ' + date.getHours().toString() + ':' + date.getMinutes().toString() + '</span>' +
                '</div>' +
                '<p id="' + postKey + '_body">' + postBody + '</p>' +
                '<img id="' + postKey + '_postImage" class="postImage" src="' + postImage + '"/>' +
                '<div class="postMenu"><button id="' + postKey + '_like" class="btn btn-link" onclick="" >' +
                '<i id="' + postKey + '_like" class="fa fa-heart-o fa-fw" onclick="clickLike(event)">&nbsp' + likeCount + '</i></button></div>' +
                '<ul id="' + postKey + '_commentList" class="comment"></ul>' +
                '<div class="msg-input"><div class="input-group">' +
                '<input id="' + postKey + '_commentBody" type="text" class="form-control" placeholder="留言...">' +
                '<span class="input-group-btn">' +
                '<button id="' + postKey + '_comment" class="btn btn-primary" onclick="writeNewComment(event)" type="button"><i class="fa fa-paper-plane fa-fw" aria-hidden="true"></i>&nbsp;發送</button>' +
                '</span>' +
                '</div></div>' +
                '</li>';
        }

        var commentsRef = firebase.database().ref('post-comments/' + postKey);
        commentsRef.on('child_added', function (data) {
            var html = createCommentElement(data.key, data.val().userId, data.val().userName, data.val().userImage, data.val().commentBody, data.val().commentTime);
            $('#' + postKey + '_commentList').append(html);
        });

        var likeCountRef = firebase.database().ref('posts/' + postKey + '/likeCount');
        likeCountRef.on('value', function (snapshot) {
            $('i#'+postKey+'_like').html('&nbsp'+snapshot.val());
        });

        listeningFirebaseRefs.push(commentsRef);
        listeningFirebaseRefs.push(likeCountRef);

        return html;
    }

    function createCommentElement(commentKey, userId, userName, userImage, commentBody, commentTime) {
        var date = new Date(parseInt(commentTime));
        var html =
            '<li id =' + commentKey + '>' + userName + ':' + commentBody + '</li>';
        return html;
    }

    $("#img_input").on('click', function () {
        var file = $(this).parent().parent().parent().find('.file');
        file.trigger('click');
    });

    $("#file").on("change", function (event) {
        $(this).parent().find('.form-control').val($(this).val().replace(/C:\\fakepath\\/i, ''));
        var reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]); // 讀取檔案
        reader.onload = function (arg) {
            var img = '<img class="preview" src="' + arg.target.result + '" alt="preview"/>';
            $("#img_preview").empty().append(img);
            newImageFile = $('.preview').croppie({
                viewport: {
                    width: 600,
                    height: 600,
                    type: 'square'
                },
                boundary: {
                    width: 600,
                    height: 600
                }
            });
        }
    });

    $('#clearNewPost').on('click', function (event) {
        event.preventDefault();
        $('.form-control').val("");
        $('#newPost_body').val("");
        $("#img_preview").empty();
        newImageFile = null;
    });

    $('#userInfo').on('click', function (event) {
        event.preventDefault();
        window.location.href = "/profile?u=" + currentUserId;
    });

    $('#writeNewPost').on('click', function (event) {
        event.preventDefault();
        var postBody = $('#newPost_body').val();
        var date = new Date();
        var postTime = date.getTime();
        var newPostKey = firebase.database().ref().child('posts').push().key;
        var metadata = {
            contentType: 'image/jpeg'
        };

        newImageFile.croppie('result', {
            type: 'blob',
            size: 'viewport',
            format: 'jpeg'
        }).then(function (resp) {
            var uploadTask = firebase.storage().ref().child('postImage/' + newPostKey).put(resp, metadata);
            uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
                function (snapshot) {
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
                function (error) {
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
                function () {
                    // Upload completed successfully, now we can get the download URL
                    var downloadURL = uploadTask.snapshot.downloadURL;
                    // A post entry.
                    var postData = {
                        userId: currentUserId,
                        userName: userName,
                        userImage: userImage,
                        postBody: postBody,
                        postTime: postTime,
                        postImage: downloadURL,
                        likeCount: 0
                    };

                    var sets = {};
                    sets['/posts/' + newPostKey] = postData;

                    firebase.database().ref().update(sets);
                    $('.form-control').val("");
                    $('#newPost_body').val("");
                    $("#img_preview").empty();
                    newImageFile = null;


                    var thisYear = date.getFullYear();
                    var thisMonth = date.getMonth() + 1;
                    firebase.database().ref('statistic/' + thisYear + '-' + thisMonth + '/postCount').transaction(function (currentCount) {
                        return currentCount + 1;
                    });
                });
        });
    });

    window.dragHandler = function (e) {
        e.stopImmediatePropagation(); //防止瀏覽器執行預設動作
        e.preventDefault();
    }

    window.dropImage = function (e) {
        e.stopImmediatePropagation(); //防止瀏覽器執行預設動作
        e.preventDefault();
        var reader = new FileReader();
        reader.readAsDataURL(e.dataTransfer.files[0]); // 讀取檔案
        // 渲染至頁面
        reader.onload = function (arg) {
            var img = '<img class="preview" src="' + arg.target.result + '" alt="preview"/>';
            $("#img_preview").empty().append(img);
            newImageFile = $('.preview').croppie({
                viewport: {
                    width: 600,
                    height: 600,
                    type: 'square'
                },
                boundary: {
                    width: 600,
                    height: 600
                }
            });
        }
    }

    window.sendUpdate = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -5);
        var date = new Date();
        var postTime = date.getTime();
        var postBody = $('#' + postKey + '_newBody').val();
        var postImage = $('#' + postKey + '_postImage').attr('src');

        var postData = {
            userId: currentUserId,
            userName: userName,
            userImage: userImage,
            postBody: postBody,
            postTime: postTime,
            postImage: postImage
        };

        var updates = {};
        updates['/posts/' + postKey] = postData;
        firebase.database().ref().update(updates);

    }

    window.clickUpdate = function (event) {
        event.preventDefault();
        var updateId = event.target.id.slice(0, -7);

        $('#' + updateId + '_operate').html(
            '<button id="' + updateId + '_send" class="btn btn-default" onclick="sendUpdate(event)" >' +
            '<i id="' + updateId + '_send" class="fa fa-floppy-o" onclick="sendUpdate(event)" title="save"></i></a>'
        );
        var oldBody = $('#' + updateId + '_body').text();
        $('#' + updateId + '_body').html(
            '<textarea id="' + updateId + '_newBody" class="form-control" rows="3">' + oldBody + '</textarea>'
        );
    }

    window.clickDelete = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -7);
        var timeArray = $('#' + postKey + '_postTime').text().split("/");

        swal({
                title: "確認刪除留言?",
                text: "刪除後留言將無法復原",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "刪除",
                closeOnConfirm: false
            },
            function () {
                var deletes = {};
                deletes['/posts/' + postKey] = null;
                firebase.database().ref().update(deletes);
                swal("已刪除", "留言已經成功刪除", "success");
                firebase.database().ref('statistic/' + timeArray[0] + '-' + timeArray[1] + '/postCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });

            });
    }

    window.writeNewComment = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -8);
        var date = new Date();
        var commentTime = date.getTime();
        var commentBody = $('#' + postKey + '_commentBody').val();
        var newCommentKey = firebase.database().ref().child('post-comments').push().key;

        var commentData = {
            userId: currentUserId,
            userName: userName,
            userImage: userImage,
            commentBody: commentBody,
            commentTime: commentTime
        };

        var updates = {};
        updates['/post-comments/' + postKey + '/' + newCommentKey] = commentData;
        firebase.database().ref().update(updates);
        $('#' + postKey + '_commentBody').val("");
    }

    window.clickLike = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -5);
        firebase.database().ref('/post-likes/' + postKey + '/' + currentUserId).once("value", function (snapshot) {
            console.log(snapshot);
            if (snapshot.val() != null) {
                var deletes = {};
                deletes['/post-likes/' + postKey + '/' + currentUserId] = null;
                firebase.database().ref().update(deletes);
                firebase.database().ref('/posts/' + postKey + '/' + 'likeCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });
            } else {
                var likeData = {
                    userName: userName
                };
                var updates = {};
                updates['/post-likes/' + postKey + '/' + currentUserId] = likeData;
                firebase.database().ref().update(updates);
                firebase.database().ref('/posts/' + postKey + '/' + 'likeCount').transaction(function (currentCount) {
                    return currentCount + 1;
                });
            }
        });
    }

});