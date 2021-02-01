<template>
    <v-card outlined>
        <v-container>
            <v-file-input v-if="!initImages" accept="image/png,image/jpg,image/jpeg" class="imageInput" prepend-icon="mdi-camera" chips clear-icon="" multiple label="Add Up to 10 photos and/or a video." v-model="imageFiles" append-icon="mdi-close" @change="handleFileUpload" @click:append="handleFileClose" ></v-file-input>
            <v-file-input v-else accept="image/png,image/jpg,image/jpeg" class="imageInput" prepend-icon="mdi-camera" chips clear-icon="" multiple label="Add Up to 10 photos and/or a video." v-model="additionalFiles" append-icon="mdi-close" @change="handleFileUpload" @click:append="handleFileClose" ></v-file-input>
            <v-row justify="center" align="center" id="sortableContainer">
                <v-col class="sortableCol" cols="12" md="4" v-for="image in imageObjs" :key="image.id">
                    <v-card outlined>
                        <img :src="image.tempUrl"/>
                        <div align="center" style="padding: 10px;">
                            <v-icon @click="deleteImage(image.id)">mdi-delete-outline</v-icon>
                        </div>
                    </v-card>
                </v-col>
                <v-col v-if="isLoading">
                    <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
                </v-col>
            </v-row>
        </v-container>
    </v-card>
</template>

<script>
import { storage } from '../../firebase'
import Sortable from 'sortablejs'

export default {
    name: 'ExerciseImageUploader',
    data() {
        return {
            isLoading: false,
            imageObjs:  [],
            imgIterator: 0,

            // Firebase:
            downloadedImageCounter: 0,
            downloadedImageUrls: [],

            // Sortable:
            sortable: null,
            sortableOptions: {
                animation: 300,
                onEnd: this.changeOrder
            },

            // Vuetify:
            imageFiles: [],
            additionalFiles: []
        }
    },

    props: {
        initImages: {
            type: Array,
            required: false
        }
    },

    mounted: function() {
        if (this.$props.initImages) {
            this.isLoading = true;
            let i = 0;

            this.$props.initImages.forEach(img => {
                this.downloadImage(img, i);
                i ++;
            })
        }
    },

    methods: {
        downloadImage: function(ref, order) {
            storage.ref(ref).getDownloadURL().then(url => {
                this.downloadedImageUrls.push({ order: order, imgUrl: url })
                this.downloadedImageCounter ++;
            })
        },

        handleFileUpload: function(e) {
            // Check if there has actually been a change (and the user hasn't
            // just opened image uploader and closed.)
            let change = false;
            if (this.imageObjs.length === 0) {
                change = true;
            } else {
                e.forEach(newInput => {
                    let found = false;
                    this.imageObjs.forEach(oldInput => {
                        if (newInput.name == oldInput.file.name) {
                            found = true
                        }
                    })

                    if (!found) {
                        change = true;
                    }
                })
            }

            // If there's been a change, push new file into imageObjs.
            if (change) {
                e.forEach(file => {
                    const i = this.imgIterator;
                    this.imageObjs.push({ id: i, file: file, tempUrl: URL.createObjectURL(file) });
                    this.imgIterator ++;
                })
            }

            // Regardless, reset imageFiles to be equal to the files in imageObjs
            this.imageFiles = [];
            this.imageObjs.forEach(img => {
                this.imageFiles.push(img.file);
            })
        },

        deleteImage: function(id) {
            console.log(id);
            let index = this.imageObjs.findIndex(x => x.id === id);
            
            this.imageObjs.splice(index, 1);
            this.imageFiles.splice(index, 1);
        },

        handleFileClose: function() {
            this.imageObjs = [];
            this.imageFiles = [];
        },

        changeOrder: function(e) {
            if (e.newIndex !== e.oldIndex) {
                this.imageFiles.splice(e.newIndex, 0, this.imageFiles.splice(e.oldIndex, 1)[0]);
                this.imageObjs.splice(e.newIndex, 0, this.imageObjs.splice(e.oldIndex, 1)[0]);
            }

            console.log("change files:", this.imageFiles);
            console.log("change obj:",this.imageObjs);
        }
    },

    watch: {
        imageObjs: function(n) {
            if (n.length > 0 && !this.sortable) {
                this.sortable = new Sortable(document.getElementById("sortableContainer"), this.sortableOptions);
            } else {
                this.sortable = null;
            }

            this.$emit("updateImgFiles", this.imageFiles);
        },

        downloadedImageCounter: function() {
            // This is only ran if we are editing (and thus there are props.)
            if (this.$props.initImages) {
                if (this.downloadedImageCounter >= this.$props.initImages.length) {
                    this.downloadedImageUrls.sort((a, b) => a.order - b.order)

                    this.downloadedImageUrls.forEach(img => {
                        this.imageObjs.push({ id: img.order, tempUrl: img.imgUrl, file: null });
                        this.imageFiles.push(img.imgUrl);
                    })

                    this.isLoading = false;
                }
            }
        }
    }
}
</script>

<style scoped>
    .imageInput {
        padding: 5px;
        margin-top: 0;
    }

    .sortableCol img {
        width: 100%;
        height: auto;
    }

    .sortableCol img:hover {
        cursor: pointer;
    }
</style>