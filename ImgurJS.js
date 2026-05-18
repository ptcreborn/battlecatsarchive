var ImgurJS = {
    uploadImgUr: function(inputID, imgID, uploadingCallback, doneUploadCallback) {
        // inputID is the input field
        // imgID is the DIV that will hold the images preview after being uploaded
        // uploadingCallback is a function to execute while uploading is held
        // doneUploadCallback is a function to execute after an upload is held
        document.getElementById(inputID).addEventListener('input', function(e) {
            var file = e.target.files[0];
            if (!file || !file.type.match(/image.*/))
                return;
            uploadingCallback();
            var fd = new FormData();
            fd.append("image", file); // Append the file
            var xhr = new XMLHttpRequest(); // Create the XHR (Cross-Domain XHR FTW!!!) Thank you sooooo much imgur.com
            xhr.open("POST", "https://api.imgur.com/3/image"); // Boooom!
            xhr.onload = function() {
                if (xhr.status == 200) {
                    let url = JSON.parse(xhr.responseText).data.link;
                    url = new URL(url);

                    let temp = url.pathname;
                    temp = temp.split('.');
                    temp[0] += 'm';

                    if (temp[1] == 'gif')
                        document.getElementById(imgID).src = url.href;
                    else {
                        temp = temp.join('.');
                        document.getElementById(imgID).src = `https://i.imgur.com${temp}`;
                    }

                    document.getElementById(inputID).value = '';
                    doneUploadCallback();
                    return JSON.parse(xhr.responseText).data.link;
                } else {
                    window.alert('ImgurXHR error: Error in uploading... Please try again');
                    document.getElementById(inputID).value = '';
                    imgLink.error = "Error Uploading in ImgUr";
                }
            }
            xhr.setRequestHeader('Authorization', 'Client-ID 33f63d5902f27e5');
            xhr.send(fd);
        }, false);
    },
    uploadMultipleImgs: function(inputID, divID, uploadingCallback, doneUploadCallback, errorCallback) {
        document.getElementById(inputID).addEventListener('input', function(e) {
            var file = e.target.files[0];
            if (!file || !file.type.match(/image.*/))
                return;
            uploadingCallback();
            var fd = new FormData();
            fd.append("image", file); // Append the file
            var xhr = new XMLHttpRequest(); // Create the XHR (Cross-Domain XHR FTW!!!) Thank you sooooo much imgur.com
            xhr.open("POST", "https://api.imgur.com/3/image"); // Boooom!
            xhr.onload = function() {
                if (xhr.status == 200) {
                    let img = document.createElement('img');

                    // returning a small thumbnail
                    let url = new URL(JSON.parse(xhr.responseText).data.link);
                    let temp = url.pathname.split('.');

                    if (temp[1] == 'gif')
                        img.src = JSON.parse(xhr.responseText).data.link;

                    else {
                        temp[0] += 'b';
                        temp = temp.join('.');
                    }

                    img.src = `https://i.imgur.com${temp}`;
                    document.getElementById(divID).appendChild(img);
                    document.getElementById(inputID).value = '';
                    doneUploadCallback(JSON.parse(xhr.responseText).data.link);
                    return JSON.parse(xhr.responseText).data.link;
                } else {
                    errorCallback();
                    document.getElementById(inputID).value = '';
                    window.alert(`ImgurXHR error: Error in uploading... Please try again
                        Status: ${xhr.status}
                        Please try again!`);
                }
            }
            xhr.setRequestHeader('Authorization', 'Client-ID 33f63d5902f27e5');
            xhr.send(fd);
        }, false);
    },
    uploadB64Img: function(file) {
        return new Promise((resolve, reject) => {
            var fd = new FormData();
            fd.append("image", file); // Append the file
            var xhr = new XMLHttpRequest(); // Create the XHR (Cross-Domain XHR FTW!!!) Thank you sooooo much imgur.com
            xhr.open("POST", "https://api.imgur.com/3/image"); // Boooom!
            xhr.onload = function() {
                if (xhr.status == 200) {
                    let data = JSON.parse(xhr.responseText).data;
                    resolve(data);
                } else {
                    window.alert(`ImgurXHR error: Error in uploading... Please try again
                        Status: ${xhr.status}
                        Please try again!`);
                    reject(`ImgurXHR error: Error in uploading... Please try again
                        Status: ${xhr.status}
                        Please try again!`);
                }
            }
            xhr.setRequestHeader('Authorization', 'Client-ID 33f63d5902f27e5');
            xhr.send(fd);
        });
    }
}
