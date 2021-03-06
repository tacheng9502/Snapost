jQuery(document).ready(function ($) {

    var userName, userImage, currentUserId;
    var listeningFirebaseRefs = [];

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            currentUserId = user.uid;
            userName = user.displayName;
            userImage = user.photoURL;
            $('.search-bar').css('display', 'inline-block');
            $('#userInfo').html(
                '<img src="' + userImage + '" class="img-circle" width="30px" height="30px">&nbsp;&nbsp;' +
                '<span>' + userName + '</span>'
            );
            startDatabaseQueries();
        } else {
            currentUserId = null;
            userName = null;
            userImage = null;
            listeningFirebaseRefs.forEach(function (ref) {
                ref.off();
            });
            listeningFirebaseRefs = [];
            window.location.href = '/';
        }
    });

    function startDatabaseQueries() {
        var queryText = decodeURIComponent(window.location.search.substr(1));
        var queryArray = queryText.split('=');
        if (queryArray[0] == 'key') {
            $('#keyWord').html('<i class="fa fa-search fa-fw fa-lg"></i>&nbsp;' + queryArray[1]);
            var postsRef = firebase.database().ref('posts/');
            postsRef.once('value').then(function (snapshot) {
                snapshot.forEach(function (postData) {
                    if (postData.val().postBody.includes(queryArray[1])) {
                        var html = createPostElement(postData.key, postData.val().userId, postData.val().userName, postData.val().userImage, postData.val().postBody, postData.val().postTime, postData.val().postImage, postData.val().likeCount);
                        $('#list').prepend(html);
                        $('div.noresult').attr("hidden",true);
                    }
                });
            });
        } else {
            $('#keyWord').html('<i class="fa fa-tag fa-fw fa-lg"></i>&nbsp;' + queryArray[1]);
            var tagRef = firebase.database().ref('hashtag/' + queryArray[1]);
            tagRef.once('value').then(function (snapshot) {
                snapshot.forEach(function (data) {
                    if (data.key != 'totalUsed') {
                        var postsRef = firebase.database().ref('posts/' + data.key);
                        postsRef.once('value', function (postData) {
                            var html = createPostElement(postData.key, postData.val().userId, postData.val().userName, postData.val().userImage, postData.val().postBody, postData.val().postTime, postData.val().postImage, postData.val().likeCount);
                            $('#list').prepend(html);
                            $('div.noresult').attr("hidden",true);
                        });
                    }
                });
            });
        }
    }

    function createPostElement(postKey, userId, userName, userImage, postBody, postTime, postImage, likeCount) {
        var date = new Date(parseInt(postTime));
        var likeStatus;
        firebase.database().ref('posts/' + postKey + '/likes/' + currentUserId).once("value", function (snapshot) {
            likeStatus = snapshot.val();
        });

        var html =
            '<li id="' + postKey + '" class="post">' +
            '<div class="info">' +
            '<a id="' + postKey + '_profile" href="/profile?u=' + userId + '" >' +
            '<img id="' + postKey + '_userImage" src="' + userImage + '" class="img-circle" width="25px" height="25px">' +
            '<h2 id="' + postKey + '_userName">' + userName + '</h2>' +
            '</a>' +
            '<span id="' + postKey + '_postTime" class="time">' + date.getFullYear().toString() + '/' + (date.getMonth() + 1).toString() + '/' + date.getDate().toString() + ' ' + date.getHours().toString() + ':' + date.getMinutes().toString() + '</span>';

        html = html +
            '</div>' +
            '<p id="' + postKey + '_body">' + postBody + '</p>' +
            '<img id="' + postKey + '_postImage" class="postImage" src="' + postImage + '"/>';

        if (likeStatus != null) {
            html = html +
                '<div class="postMenu">' +
                '<button class="like"><i id="' + postKey + '_like" class="fa fa-heart fa-heart-click" onclick="clickLike(event)">&nbsp;&nbsp;' + likeCount + '</i></button>' +
                '<button class="comment-btn"><i id="' + postKey + '_commentFocus" class="fa fa-comment" onclick="commentFocus(event)">&nbsp;留言</i></button>' +
                '<!--<button id="share" class="share"><i class="fa fa-share">&nbsp;分享</i></button>!-->' +
                '</div>';
        } else {
            html = html +
                '<div class="postMenu">' +
                '<button class="like"><i id="' + postKey + '_like" class="fa fa-heart" onclick="clickLike(event)">&nbsp;&nbsp;' + likeCount + '</i></button>' +
                '<button class="comment-btn"><i id="' + postKey + '_commentFocus" class="fa fa-comment" onclick="commentFocus(event)">&nbsp;留言</i></button>' +
                '<!--<button id="share" class="share"><i class="fa fa-share">&nbsp;分享</i></button>!-->' +
                '</div>';
        }

        html = html +
            '<ul id="' + postKey + '_commentList" class="comment"></ul>' +
            '<div class="msg-input"><div class="input-group">' +
            '<input id="' + postKey + '_commentBody" type="text" class="form-control" placeholder="留言...">' +
            '<span class="input-group-btn">' +
            '<button id="' + postKey + '_comment" class="btn btn-primary" onclick="writeNewComment(event)" type="button"><i class="fa fa-paper-plane fa-fw" aria-hidden="true"></i>&nbsp;發送</button>' +
            '</span>' +
            '</div></div>' +
            '</li>';

        var commentsRef = firebase.database().ref('post-comments/' + postKey);
        commentsRef.on('child_added', function (data) {
            var html = createCommentElement(postKey, data.key, data.val().userId, data.val().userName, data.val().userImage, data.val().commentBody, data.val().commentTime);
            $('#' + postKey + '_commentList').append(html);
        });
        commentsRef.on('child_removed', function (data) {
            $('#' + data.key).remove();
        });

        var likeCountRef = firebase.database().ref('posts/' + postKey + '/likeCount');
        likeCountRef.on('value', function (snapshot) {
            $('i#' + postKey + '_like').html('&nbsp;&nbsp;' + snapshot.val());
        });

        var likeStatusRef = firebase.database().ref('posts/' + postKey + '/likes/' + currentUserId);
        likeStatusRef.on('value', function (snapshot) {
            if (snapshot.val() != null) {
                $('i#' + postKey + '_like').attr("class", "fa fa-heart fa-heart-click");
            } else {
                $('i#' + postKey + '_like').attr("class", "fa fa-heart");
            }
        });

        listeningFirebaseRefs.push(commentsRef);
        listeningFirebaseRefs.push(likeCountRef);
        listeningFirebaseRefs.push(likeStatusRef);

        return html;
    }

    function createCommentElement(postKey, commentKey, userId, userName, userImage, commentBody, commentTime) {
        var html = '<li id =' + commentKey + '><a href="/profile?u=' + userId + '" >' + userName + '</a><span>' + commentBody + '</span>';
        if (currentUserId == userId) {
            html = html +
                '<button id="' + postKey + '/' + commentKey + '_delete" class="delete-btn" onclick="clickCommentDelete(event)" >' +
                '<i id="' + postKey + '/' + commentKey + '_delete" class="fa fa-times" onclick="clickCommentDelete(event)" title="delete"></i>' +
                '</button>';
        }
        html = html + '</li>';
        return html;
    }

    function stripHTML(input) {
        if (input) {
            return input
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        } else {
            return input
        }
    }

    window.clickCommentDelete = function (event) {
        event.preventDefault();
        var key = event.target.id.slice(0, -7);
        var splitKey = key.split('/');

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
                deletes['/post-comments/' + splitKey[0] + '/' + splitKey[1]] = null;
                firebase.database().ref().update(deletes);
                swal("已刪除", "留言已經成功刪除", "success");
            });

        $('.sweet-overlay').on('click', function (event) {
            swal.close();
        });
    }

    window.writeNewComment = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -8);
        var date = new Date();
        var commentTime = date.getTime();
        var commentBody = stripHTML($('#' + postKey + '_commentBody').val());
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
        firebase.database().ref('posts/' + postKey + '/likes/' + currentUserId).once("value", function (snapshot) {
            if (snapshot.val() != null) {
                var deletes = {};
                deletes['posts/' + postKey + '/likes/' + currentUserId] = null;
                firebase.database().ref().update(deletes);
                firebase.database().ref('/posts/' + postKey + '/' + 'likeCount').transaction(function (currentCount) {
                    return currentCount - 1;
                });
            } else {
                var updates = {};
                updates['posts/' + postKey + '/likes/' + currentUserId] = userName;
                firebase.database().ref().update(updates);
                firebase.database().ref('/posts/' + postKey + '/' + 'likeCount').transaction(function (currentCount) {
                    return currentCount + 1;
                });
            }
        });
    }

    window.commentFocus = function (event) {
        event.preventDefault();
        var postKey = event.target.id.slice(0, -13);
        $('#' + postKey + '_commentBody').trigger("focus");
    }

    $('#userInfo').on('click', function (event) {
        event.preventDefault();
        window.location.href = "/profile?u=" + currentUserId;
    });

    $('#searchButton').on('click', function (event) {
        event.preventDefault();
        var searchText = $('#searchText').val();
        if (searchText.match(/(^#\S+)/)) {
            window.location.href = "/search?tag=" + searchText.slice(1);
        } else {
            window.location.href = "/search?key=" + searchText;
        }
    });
});