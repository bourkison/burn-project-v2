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

            setTimeout(() => {
                this.isLoading = false;
                let ratio = (this.imgEl.clientWidth / this.imgEl.clientHeight);
                console.log(ratio);

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
                        // console.log(this.destination);
                    })
                })
            }, 1000)
        } else {            
            // this.$destroy();
            // this.$el.parentNode.removeChild(this.$el);
        }
    },

    methods: {
        addImage: function() {
            this.$emit("outputEdit", this.destination);
        }
    },

    destroyed: function() {
        // this.$emit("outputEdit", this.destination);
        // console.log("Destroy 2")
    },

    watch: {
        imgUrl: function() {
            // console.log("ImgURL watch", n, o);
            // if (n) {
            //     console.log("Here we launch Cropper.", n, o);
            //     this.isLoading = true;

            //     setTimeout(() => {
            //         this.isLoading = false;
            //         let ratio = (this.imgEl.clientWidth / this.imgEl.clientHeight);
            //         console.log(ratio);

            //         this.imgCont.style.height = "500px";
            //         this.imgCont.style.width = 500 * ratio + "px";
            //         this.imgEl.style.visibility = "visible";

            //         this.cropper = new Cropper(this.imgEl, {
            //             scalable: false,
            //             viewMode: 3,
            //             aspectRatio: 16/9,
            //             crop: (() => {
            //                 const canvas = this.cropper.getCroppedCanvas();
            //                 this.destination = canvas.toDataURL();
            //                 // console.log(this.destination);
            //             })
            //         })
            //     }, 1000)
            // } else {
            //     console.log("EMIT");
                
            //     // this.$destroy();
            //     // this.$el.parentNode.removeChild(this.$el);
            // }
        }
    }

}
</script>
