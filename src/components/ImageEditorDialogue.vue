<template>
    <v-container>
        <v-expansion-panels>
            <v-expansion-panel>
                <v-expansion-panel-header>Edit Image</v-expansion-panel-header>
                <v-expansion-panel-content>
                    <div class="img-container">
                        <img ref="image" :src="inputUrl" crossorigin>
                    </div>
                    <div><img :src="destination" class="img-preview"></div>
                    <v-btn @click="setThisFuckingCropper">SET</v-btn>
                </v-expansion-panel-content>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-container>
</template>

<script>
import Cropper from 'cropperjs'

export default {
    name: 'ImageEditorDialogue',
    props: {
        inputUrl: {
            type: String,
            required: true
        }
    },

    data() {
        return {
            cropper: {},
            destination: {},
            image: {}
        }
    },

    mounted: function() {
        setTimeout(this.setImage(), 10000);
    },

    methods: {
        setImage: function() {
        },

        setThisFuckingCropper: function() {
            this.image = this.$refs.image;

            this.cropper = new Cropper(this.image, {
                scalable: false,
                aspectRatio: 16/9,
                viewMode: 3,
                crop: () => {
                    const canvas = this.cropper.getCroppedCanvas();
                    this.destination = canvas.toDataURL("image/png");
                }
            });
        }
    },
}
</script>

<style scoped>
    .img-container {
        width: 100%;
        height: auto;
    }

    .img-container img {
        width: 100%;
        height: auto;
    }

    .img-preview {
        width: 200px;
        height: calc(200px * (1 / (16 / 9)));
        margin-left: 10px;
    }
</style>