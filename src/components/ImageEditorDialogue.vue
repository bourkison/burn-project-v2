<template>
    <div class="editImageSelectorCont" align="center">
        <div align="center" v-if="isLoading"><v-progress-circular indeterminate centered></v-progress-circular></div>
        <div class="imgContainer"><img id="cropperImg" style="visibility:hidden;" :src="imgUrl" /></div>
        <img class="imgPreview" :src="destination" />
        <div>
            <v-btn @click="addImage">Add Image</v-btn>
        </div>
    </div>
</template>

<script>
import Cropper from 'cropperjs'
import imageCompression from 'browser-image-compression'

export default {
    name: 'ImageEditorDialogue',

    props: {
        imgId: {
            required: true,
            type: Number
        },

        isAvatar: {
            required: false,
            type: Boolean
        },

        imgFile: {
            type: File,
            required: true
        }
    },

    data: function() {
        return {
            imgCont: null,
            imgEl: null,
            imgPreview: null,
            imgUrl: '',

            destination: null,
            cropper: {},

            minAspectRatio: 0.8,
            maxAspectRatio: 1,

            isLoading: false
        }
    },

    mounted: function() {
        this.imgEl = document.querySelector("#cropperImg");
        this.imgCont = document.querySelector('.imgContainer');
        this.imgPreview = document.querySelector('.imgPreview');

        if (this.$props.imgFile) {
            console.log("Here we launch Cropper.");
            this.isLoading = true;

            console.log(this.$props.imgFile);
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920
            }

            imageCompression(this.$props.imgFile, options)
            .then(file => {
                console.log("Initial File", this.$props.imgFile);
                console.log("Compressed file:", file);
                this.imgUrl = URL.createObjectURL(file);
                // Timeout is set to give image a chance to load before setting cropper.
                setTimeout(() => {
                    this.isLoading = false;
                    let ratio = (this.imgEl.clientWidth / this.imgEl.clientHeight);
                    console.log(ratio);

                    // Set image container to have a max height of 500px.
                    this.imgCont.style.height = "500px";
                    this.imgCont.style.width = 500 * ratio + "px";
                    this.imgEl.style.visibility = "visible";

                    this.cropper = new Cropper(this.imgEl, {
                        scalable: false,
                        viewMode: 3,
                        ready: (() => {
                            // On launch, set the initial cropBox to have an aspect ratio of 1.
                            let cropBoxData = this.cropper.getCropBoxData();
                            let cropBoxWidth = cropBoxData.width;

                            this.cropper.setCropBoxData({ height: cropBoxWidth / this.minAspectRatio });
                        }),
                        crop: (() => {
                            const canvas = this.cropper.getCroppedCanvas();
                            this.destination = canvas.toDataURL(this.$props.imgFile.type, 1.0);
                        }),

                        cropmove: (() => {
                            // Here we check that we are not going above or below min/max aspect ratio.
                            let cropBoxData = this.cropper.getCropBoxData();
                            let cropBoxWidth = cropBoxData.width;
                            let aspectRatio = cropBoxWidth / cropBoxData.height;

                            if (aspectRatio < this.minAspectRatio) {
                                this.cropper.setCropBoxData({ height: cropBoxWidth / this.minAspectRatio });
                            } else if (aspectRatio > this.maxAspectRatio) {
                                this.cropper.setCropBoxData({ height: cropBoxWidth / this.maxAspectRatio });
                            }
                        })
                    })
                }, 250);
            })
            .catch(e => {
                console.error("image compression", e);
            })

        }

        // If avatar, add class that makes Cropper circular.
        if (this.$props.isAvatar) {
            document.querySelector(".editImageSelectorCont").classList.add("avatarCont");
        }
    },

    methods: {
        addImage: function() {
            this.$emit("outputEdit", this.destination, this.$props.imgId);
            // let b = this.dataURLtoBlob(this.destination);
            // console.log("Cropped file:", b);
        },

        // dataURLtoBlob: function(dataurl) {
        //     var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        //         bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        //     while(n--){
        //         u8arr[n] = bstr.charCodeAt(n);
        //     }
        //     return new Blob([u8arr], {type:mime});
        // }
    }
}
</script>

<style>
.avatarCont .cropper-crop-box, 
.avatarCont .cropper-view-box {
    border-radius: 50%;
}

.avatarCont .cropper-view-box {
    box-shadow: 0 0 0 1px #39f;
    outline: 0;
}

.avatarCont .imgPreview {
    border-radius: 50%;
}

.imgPreview {
    display: none;
}
</style>
