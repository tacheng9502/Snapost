jQuery(document).ready(function ($) {
  var userName, userImage, currentUserId;
  var listeningFirebaseRefs = [];
  var queryId = window.location.search.substr(3);

  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      window.location.href = 'https://immense-falls-61701.herokuapp.com/';
    } else {
      userName = user.displayName;
      userImage = user.photoURL;
      currentUserId = user.uid;
      $('#userInfo').html(
        '<img src="' + userImage + '" class="img-circle" width="30px">&nbsp;&nbsp;' +
        '<span>' + userName + '</span>'
      );
      startDatabaseQueries();
    }
  });

  $("#img_input").on('click', function () {
    var file = $(this).parent().parent().parent().find('.file');
    file.trigger('click');
  });

  $("#file").on("change", function (event) {
    $(this).parent().find('.form-control').val($(this).val().replace(/C:\\fakepath\\/i, ''));
    newImageFile = event.target.files[0]; //獲得圖片資源
    var reader = new FileReader();
    reader.readAsDataURL(newImageFile); // 讀取檔案
    reader.onload = function (arg) {
      var img = '<img class="preview" width="300px" src="' + arg.target.result + '" alt="preview"/>';
      $("#img_preview").empty().append(img);
    }
  });

  function startDatabaseQueries() {

      var profileRef = firebase.database().ref('users/'+queryId+"/");
      profileRef.on('value', function (data) {
        $("#user_posts").append(data.val().userPostCount);
        $("#user_fans").append(data.val().userFanCount);
        $("#user_followers").append(data.val().userFollowCount);
          // var html = createPostElement(data.key, data.val().userId, data.val().userName, data.val().userImage, data.val().postBody, data.val().postTime, data.val().postImage, data.val().likeCount);
          // $('#list').prepend(html);
      });

      var postRef = firebase.database().ref('users/'+queryId+'/userPost');
      postRef.once('value', function (data) {
        data.forEach(function(childdata){
          var postKey = childdata.key;
          var postImage = childdata.val();
          var html =
              '<li id="' + postKey + '">' +
              '<img id="' + postKey + '_postImage" class="postImage" src="' + postImage + '"/>' +
              '</li>';
          $("#list").append(html);
        });
      });

      //listeningFirebaseRefs.push(profileRef);
  }

  function showFan(){
    $("#result").empty();
    var fanRef = firebase.database().ref('users/'+queryId+'userFan');
    fanRef.once('value', function (data) {
      data.forEach(function (childdata){
        var fanID = childdata.key;
        var fanName = childdata.val();
        var html =
            '<tr><td><a href="/profile?u=' + fanID + '">' + fanName + '</a></td>'+
            '<td><button id="' + fanID +'" class="btn btn-default" onclick="clickUnfan(event)">移除粉絲</button></td>';
        $("#result").append(html);
      });
    });
  }

  function showFollow(){
    $("#result").empty();
    var followRef = firebase.database().ref('users/'+queryId+'userFollow');
    followRef.once('value', function (data) {
      data.forEach(function (childdata){
        var followID = childdata.key;
        var followName = childdata.val();
        var html =
            '<tr><td><a href="/profile?u=' + followID + '">' + followName + '</a></td>'+
            '<td><button id="' + followID +'" class="btn btn-default" onclick="clickUnfan(event)">取消追蹤</button></td>';
        $("#result").append(html);
      });
    });
  }

  function createPostElement(postKey, userId, userName, userImage, postBody, postTime, postImage, likeCount) {
      var date = new Date(parseInt(postTime));
      var likeStatus;
      firebase.database().ref('posts/' + postKey + '/likes/' + currentUserId).once("value", function (snapshot) {
          likeStatus = snapshot.val();
      });

      var html =
          '<li id="' + postKey + '">' +
          '<div class="info">' +
          '<a id="' + postKey + '_profile" href="/profile?u=' + userId + '" >' +
          '<img id="' + postKey + '_userImage" src="' + userImage + '" class="img-circle" width="25px">' +
          '<h2 id="' + postKey + '_userName">' + userName + '</h2>' +
          '</a>' +
          '<span id="' + postKey + '_postTime" class="time">' + date.getFullYear().toString() + '/' + (date.getMonth() + 1).toString() + '/' + date.getDate().toString() + ' ' + date.getHours().toString() + ':' + date.getMinutes().toString() + '</span>';

      if (currentUserId === userId) {
          html = html +
              '<div id="' + postKey + '_operate" class="navi pull-right">' +
              '<button id="' + postKey + '_update" class="btn btn-default" onclick="clickUpdate(event)" >' +
              '<i id="' + postKey + '_update" class="fa fa-pencil" onclick="clickUpdate(event)" title="edit"></i>' +
              '</button>&nbsp;' +
              '<button id="' + postKey + '_delete" class="btn btn-default" onclick="clickDelete(event)" >' +
              '<i id="' + postKey + '_delete" class="fa fa-trash" onclick="clickDelete(event)" title="delete"></i>' +
              '</button>' +
              '</div>';
      }

      html = html +
          '</div>' +
          '<p id="' + postKey + '_body">' + postBody + '</p>' +
          '<img id="' + postKey + '_postImage" class="postImage" src="' + postImage + '"/>';

      if (likeStatus != null) {
          html = html +
              '<div class="postMenu"><button id="' + postKey + '_like" class="btn btn-link">' +
              '<i id="' + postKey + '_like" class="fa fa-heart" onclick="clickLike(event)">&nbsp' + likeCount + '</i></button></div>';
      } else {
          html = html +
              '<div class="postMenu"><button id="' + postKey + '_like" class="btn btn-link">' +
              '<i id="' + postKey + '_like" class="fa fa-heart-o fa-fw" onclick="clickLike(event)">&nbsp' + likeCount + '</i></button></div>';
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
          var html = createCommentElement(data.key, data.val().userId, data.val().userName, data.val().userImage, data.val().commentBody, data.val().commentTime);
          $('#' + postKey + '_commentList').append(html);
      });

      var likeCountRef = firebase.database().ref('posts/' + postKey + '/likeCount');
      likeCountRef.on('value', function (snapshot) {
          $('i#' + postKey + '_like').html('&nbsp' + snapshot.val());
      });

      var likeStatusRef = firebase.database().ref('posts/' + postKey + '/likes/' + currentUserId);
      likeStatusRef.on('value', function (snapshot) {
          if (snapshot.val() != null) {
              $('i#' + postKey + '_like').attr("class", "fa fa-heart");
          } else {
              $('i#' + postKey + '_like').attr("class", "fa fa-heart-o fa-fw");
          }
      });

      listeningFirebaseRefs.push(commentsRef);
      listeningFirebaseRefs.push(likeCountRef);
      listeningFirebaseRefs.push(likeStatusRef);

      return html;
  }

  function createCommentElement(commentKey, userId, userName, userImage, commentBody, commentTime) {
      var date = new Date(parseInt(commentTime));
      var html =
          '<li id =' + commentKey + '>' + userName + ':' + commentBody + '</li>';
      return html;
  }

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

  $('#user_fans').on('click', function (event) {
      event.preventDefault();
      showFan();
  });

  $('#user_followers').on('click', function (event) {
      event.preventDefault();
      showFollow();
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
              deletes['/post-comments/' + postKey] = null;
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
})
