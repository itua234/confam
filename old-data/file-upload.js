$(document).ready(function() {
    //  Select all file input elements within your accordion
    $('.accordion-body').on('change', 'input[type="file"]', function(event) {
        const fileInput = $(this);        //  The input element that triggered the change
        const file = fileInput[0].files[0]; //  The first selected file (File object)
        const docType = fileInput.attr('name'); //  Get the name attribute (e.g., 'passport')
        const docIndex = fileInput.attr('id').split('-')[1];

        console.log('File selected!', { file, docType });

        if (file) {
            //  Perform client-side validation (example)
            if (file.size > 2 * 1024 * 1024) {  //  2MB limit (adjust as needed)
                alert('File size exceeds 2MB. Please select a smaller file.');
                fileInput.val('');  //  Clear the input
                return;
            }

            //  You can now:
            //  1.  Display the file name
            //  2.  Show a preview (if it's an image)
            //  3.  Prepare for upload (FormData)
            displayFileName(fileInput, file.name);
            previewImage(fileInput, file);
            //  ... or start the upload process
            //uploadFile(file, docType);
        }
    });

    function displayFileName(inputElement, fileName) {
        //  Example: Display the filename next to the input
        const fileNameDisplay = inputElement.next('.file-name-display');
        if (fileNameDisplay.length) {
            fileNameDisplay.text(fileName);
        } else {
            inputElement.parent().append(`<span class="file-name-display">${fileName}</span>`);
        }
    }

    function previewImage(inputElement, file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                //  Example:  Show preview below the input
                const preview = inputElement.parent().find('.image-preview');
                if (preview.length) {
                    preview.attr('src', e.target.result);
                } else {
                    inputElement.parent().append(`<img src="${e.target.result}" class="image-preview" style="max-width: 100px; max-height: 100px;">`);
                }

            }
            reader.readAsDataURL(file);
        }
    }

    function uploadFile(file, docType) {
        const formData = new FormData();
        formData.append('file', file);           //  'file' is the field name on the server
        formData.append('docType', docType);     //  Send document type too

        $.ajax({
            url: '/your-upload-endpoint',  //  Replace with your server endpoint
            type: 'POST',
            data: formData,
            contentType: false,             //  Important: Don't set content type
            processData: false,             //  Important: Don't process data
            dataType: 'json',               //  Expect JSON response
            xhr: function() {              //  XHR for progress (optional)
                const xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(event) {
                        if (event.lengthComputable) {
                            const percentComplete = (event.loaded / event.total) * 100;
                            console.log('Upload progress:', percentComplete);
                            //  Update progress bar here (if you have one)
                        }
                    }, false);
                }
                return xhr;
            },
            success: function(response) {
                console.log('Upload success:', response);
                //  Handle success (e.g., show message, update UI)
            },
            error: function(error) {
                console.error('Upload error:', error);
                //  Handle error
            }
        });
    }
});