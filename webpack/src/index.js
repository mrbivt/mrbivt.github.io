import $ from 'jquery'; // Nếu bạn đang sử dụng jQuery

// Chèn dotenv nếu cần thiết trong môi trường Node.js
require('dotenv').config();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'mrbivt/webwidget'; // Thay thế bằng tên repo của bạn
const BRANCH = 'main'; // Nhánh mặc định

$(document).ready(function() {
    var $sliderHandle = $('.slider-handle');
    var $before = $('.before');
    var $after = $('.after');
    var sliderWidth = $('.slider-container').width();
    var isDragging = false;
    var setCount = 0;

    $after.css('clip-path', 'inset(0 ' + (sliderWidth / 2) + 'px 0 0)');

    function updateSlider(offsetX) {
        $sliderHandle.css('left', offsetX);
        $after.css('clip-path', 'inset(0 ' + (sliderWidth - offsetX) + 'px 0 0)');
    }

    function onMouseMove(e) {
        if (isDragging) {
            var offsetX = e.clientX - $sliderHandle.parent().offset().left;
            offsetX = Math.max(0, Math.min(offsetX, sliderWidth));
            updateSlider(offsetX);
        }
    }

    $sliderHandle.on('mousedown', function(e) {
        isDragging = true;
        e.preventDefault();
        $(document).on('mousemove', onMouseMove);
    });

    $(document).on('mouseup', function() {
        isDragging = false;
        $(document).off('mousemove', onMouseMove);
    });

    window.loadImage = function(event, type) {
        var input = event.target;
        var reader = new FileReader();

        reader.onload = function(e) {
            if (type === 'before') {
                $('#before-image').attr('src', e.target.result);
            } else {
                $('#after-image').attr('src', e.target.result);
            }
            $after.css('clip-path', 'inset(0 ' + (sliderWidth / 2) + 'px 0 0)');
        }

        if (input.files && input.files[0]) {
            reader.readAsDataURL(input.files[0]);
        }
    }

    $('#reset').on('click', function() {
        $('#before-image').attr('src', 'https://raw.githubusercontent.com/mrbivt/webwidget/main/before.jpg');
        $('#after-image').attr('src', 'https://raw.githubusercontent.com/mrbivt/webwidget/main/after.jpg');
        $after.css('clip-path', 'inset(0 ' + (sliderWidth / 2) + 'px 0 0)');
        $('#set-name').val('');
    });

    $('#add-set').on('click', function() {
        var setName = $('#set-name').val().trim();
        if (!setName) {
            alert('Vui lòng nhập tên cho bộ ảnh!');
            return;
        }

        var beforeImage = $('#before-image').attr('src');
        var afterImage = $('#after-image').attr('src');

        var $set = $('<div class="set" data-index="' + setCount + '"></div>');
        var $beforeSetImg = $('<img src="' + beforeImage + '" alt="Set Before Image">');
        var $afterSetImg = $('<img src="' + afterImage + '" alt="Set After Image">');
        var $setNameLabel = $('<div class="set-name">' + setName + '</div>');
        var $options = $('<div class="options"><button class="edit">Edit</button><button class="delete">Delete</button></div>');

        $set.append($beforeSetImg).append($afterSetImg).append($setNameLabel).append($options);
        $('#album').append($set);

        // Lưu bộ ảnh vào local storage
        saveToLocalStorage(setName, beforeImage, afterImage);

        // Upload cả hai ảnh lên GitHub
        uploadToGithub(beforeImage, setName + '_before.jpg');
        uploadToGithub(afterImage, setName + '_after.jpg');

        setCount++;
    });

    function saveToLocalStorage(setName, beforeImage, afterImage) {
        let sets = JSON.parse(localStorage.getItem('imageSets')) || [];
        sets.push({ name: setName, before: beforeImage, after: afterImage });
        localStorage.setItem('imageSets', JSON.stringify(sets));
    }

    function loadFromLocalStorage() {
        let sets = JSON.parse(localStorage.getItem('imageSets')) || [];
        sets.forEach((set, index) => {
            var $set = $('<div class="set" data-index="' + index + '"></div>');
            var $beforeSetImg = $('<img src="' + set.before + '" alt="Set Before Image">');
            var $afterSetImg = $('<img src="' + set.after + '" alt="Set After Image">');
            var $setNameLabel = $('<div class="set-name">' + set.name + '</div>');
            var $options = $('<div class="options"><button class="edit">Edit</button><button class="delete">Delete</button></div>');

            $set.append($beforeSetImg).append($afterSetImg).append($setNameLabel).append($options);
            $('#album').append($set);
        });
    }

    loadFromLocalStorage();

    function uploadToGithub(imageDataUrl, fileName) {
        const base64Data = imageDataUrl.split(',')[1];

        // Lấy thông tin tệp để kiểm tra xem nó đã tồn tại chưa
        $.ajax({
            url: `https://api.github.com/repos/${REPO}/contents/${fileName}`,
            type: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            },
            success: function(response) {
                // Nếu tệp đã tồn tại, sử dụng SHA để cập nhật tệp
                updateFile(fileName, response.sha, base64Data);
            },
            error: function(error) {
                // Nếu tệp chưa tồn tại (lỗi 404), thực hiện upload mới
                if (error.status === 404) {
                    createFile(fileName, base64Data);
                } else {
                    console.error('Error uploading to GitHub: ', error);
                }
            }
        });
    }

    function createFile(fileName, base64Data) {
        $.ajax({
            url: `https://api.github.com/repos/${REPO}/contents/${fileName}`,
            type: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                message: `Upload ${fileName}`,
                content: base64Data,
                branch: BRANCH
            }),
            success: function(response) {
                console.log('Uploaded to GitHub: ', response);
            },
            error: function(error) {
                console.error('Error uploading to GitHub: ', error);
            }
        });
    }

    function updateFile(fileName, sha, base64Data) {
        $.ajax({
            url: `https://api.github.com/repos/${REPO}/contents/${fileName}`,
            type: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                message: `Update ${fileName}`,
                content: base64Data,
                sha: sha,
                branch: BRANCH
            }),
            success: function(response) {
                console.log('Updated to GitHub: ', response);
            },
            error: function(error) {
                console.error('Error updating to GitHub: ', error);
            }
        });
    }

    window.deleteFromGithub = function(fileName, callback) {
        $.ajax({
            url: `https://api.github.com/repos/${REPO}/contents/${fileName}`,
            type: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            },
            success: function(response) {
                // Gọi hàm xóa tệp
                deleteFile(fileName, response.sha, callback);
            },
            error: function(error) {
                console.error('Error retrieving file info from GitHub: ', error);
                callback(); // Gọi callback ngay cả khi có lỗi
            }
        });
    }

    function deleteFile(fileName, sha, callback) {
        $.ajax({
            url: `https://api.github.com/repos/${REPO}/contents/${fileName}`,
            type: 'DELETE',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                message: `Delete ${fileName}`,
                sha: sha,
                branch: BRANCH
            }),
            success: function(response) {
                console.log('Deleted from GitHub: ', response);
                callback(); // Gọi callback khi xóa xong
            },
            error: function(error) {
                console.error('Error deleting from GitHub: ', error);
                callback(); // Gọi callback ngay cả khi có lỗi
            }
        });
    }
});
