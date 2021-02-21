<template>
    <div align="center">
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

export default {
    name: 'ImageEditorDialogue',

    props: {
        imgUrl: {
            required: true,
            type: String
        },

        imgId: {
            required: true,
            type: Number
        },

        isAvatar: {
            required: false,
            type: Boolean
        }
    },

    data: function() {
        return {
            imgCont: null,
            imgEl: null,
            imgPreview: null,

            destination: null,
            cropper: {},

            isLoading: false
        }
    },

    mounted: function() {
        this.imgEl = document.querySelector("#cropperImg");
        this.imgCont = document.querySelector('.imgContainer');
        this.imgPreview = document.querySelector('.imgPreview');

        // console.log("mounted", this.$props.imgUrl);

        if (this.$props.imgUrl) {
            console.log("Here we launch Cropper.");
            this.isLoading = true;

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
                    aspectRatio: 1,
                    crop: (() => {
                        const canvas = this.cropper.getCroppedCanvas();
                        this.destination = canvas.toDataURL();
                    })
                })

                // console.log(document.querySelector(".cropper-move"))
            }, 500)
        }
    },

    methods: {
        addImage: function() {
            this.$emit("outputEdit", this.destination, this.$props.imgId);
        }
    }
}
</script>

<style v-if="isAvatar">
.cropper-crop-box, .cropper-view-box {
    border-radius: 50%;
}

.cropper-view-box {
    box-shadow: 0 0 0 1px #39f;
    outline: 0;
}

.imgPreview {
    border-radius: 50%;
    display: none;
}
</style>
