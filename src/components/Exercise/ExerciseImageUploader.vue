<template>
    <v-card outlined>
        <v-container>
            <v-file-input v-if="!initImages" accept="image/png,image/jpg,image/jpeg" class="imageInput" prepend-icon="mdi-camera" chips clear-icon="" multiple label="Add Up to 10 photos and/or a video." v-model="imageFiles" append-icon="mdi-close" @change="handleFileUpload" @click:append="handleFileClose" ></v-file-input>
            <v-file-input v-else accept="image/png,image/jpg,image/jpeg" class="imageInput" prepend-icon="mdi-camera" chips clear-icon="" multiple label="Add Up to 10 photos and/or a video." v-model="additionalFiles" append-icon="mdi-close" @change="handleEditFileUpload" @click:append="handleEditFileClose" ></v-file-input>
            <v-row justify="center" align="center" id="sortableContainer">
                <v-col class="sortableCol" cols="12" md="4" v-for="image in imageObjs" :key="image.id">
                    <v-card outlined>
                        <img :src="image.tempUrl"/>
                        <div align="center" style="padding: 10px;">
                            <v-icon @click.stop="editImageToggle(image.tempUrl)">mdi-image-edit-outline</v-icon>
                            <v-icon @click="deleteImage(image.id)">mdi-delete-outline</v-icon>
                        </div>
                    </v-card>
                </v-col>
                <v-col v-if="isLoading">
                    <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
                </v-col>
                <ImageEditorDialogue :inputUrl="inputCropperImgSrc"></ImageEditorDialogue>
            </v-row>

        </v-container>
    </v-card>
</template>

<script>
import { storage } from '../../firebase'
import Sortable from 'sortablejs'

import ImageEditorDialogue from '../ImageEditorDialogue.vue'

export default {
    name: 'ExerciseImageUploader',
    components: { ImageEditorDialogue },
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
            additionalFiles: [],
            deletedFiles: [],
            editingImageDialogue: false,

            // CropperJs
            inputCropperImgSrc: '',
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
                this.downloadedImageUrls.push({ order: order, imgUrl: url, imgPath: ref })
                this.downloadedImageCounter ++;
            })
        },

        checkIfChange: function(e) {
            let found = false;

            if (this.imageObjs.length === 0) {
                return true;
            } else {
                e.forEach(newInput => {        
                    this.imageObjs.forEach(oldInput => {
                        if (oldInput.file) {
                            if (newInput.name == oldInput.file.name) {
                                found = true
                            }
                        }
                    })
                })
            }

            if (found) {
                return false
            } else {
                return true;
            }
        },

        handleFileUpload: function(e) {
            // Check if there has actually been a change (and the user hasn't
            // just opened image uploader and closed.)
            let change = this.checkIfChange(e);
            
            // If there's been a change, push new file into imageObjs.
            if (change) {
                e.forEach(file => {
                    const i = this.imgIterator;
                    this.imageObjs.push({ id: i, file: file, tempUrl: URL.createObjectURL(file), path: null });
                    this.imgIterator ++;
                })
            }

            // Regardless, reset imageFiles to be equal to the files in imageObjs
            this.imageFiles = [];
            this.imageObjs.forEach(img => {
                this.imageFiles.push(img.file);
            })
        },

        handleEditFileUpload: function(e) {
            let change = this.checkIfChange(e);

            // If there's been a change, push new file into imageObjs.
            if (change) {
                e.forEach(file => {
                    const i = this.imgIterator;
                    this.imageObjs.push({ id: i, file: file, tempUrl: URL.createObjectURL(file), path: null });
                    this.imgIterator ++;
                })
            }

            this.additionalFiles = [];
            this.imageObjs.forEach(img => {
                if (img.file != null) {
                    this.additionalFiles.push(img.file)
                }
            })
        },

        deleteImage: function(id) {
            let index = this.imageObjs.findIndex(x => x.id === id);

            if (!this.$props.initImages) {
                this.imageObjs.splice(index, 1);
                this.imageFiles.splice(index, 1);
            } else if (this.imageObjs[index].file) {
                // If we are editing but this is an additional file upload.

                // TODO: we're fiding additionalFiles index based off file name.
                // This is prone to bugs (i.e. if user uploads 2 images with same file name). 
                let additionalIndex = this.additionalFiles.findIndex(x => x.name === this.imageObjs[index].file.name)

                this.imageObjs.splice(index, 1);
                this.additionalFiles.splice(additionalIndex, 1);
            } else {
                // User is trying to delete something they have already uploaded.
                if (confirm("You are about to delete an image that you have already uploaded. Are you sure?")) {
                    this.deletedFiles.push(this.imageObjs[index].path);
                    this.imageObjs.splice(index, 1);
                }
            }
        },

        editImageToggle: function(url) {
            this.editingImageDialogue = true;
            this.inputCropperImgSrc = url;
        },

        handleFileClose: function() {
            this.imageObjs = [];
            this.imageFiles = [];
        },

        handleEditFileClose: function() {
            this.imageObjs = [];
            this.additionalFiles = [];
        },

        changeOrder: function(e) {
            if (e.newIndex !== e.oldIndex) {
                this.imageFiles.splice(e.newIndex, 0, this.imageFiles.splice(e.oldIndex, 1)[0]);
                this.imageObjs.splice(e.newIndex, 0, this.imageObjs.splice(e.oldIndex, 1)[0]);
            }
        }
    },

    watch: {
        imageObjs: function(n) {
            if (n.length > 0 && !this.sortable) {
                this.sortable = new Sortable(document.getElementById("sortableContainer"), this.sortableOptions);
            } else {
                this.sortable = null;
            }

            if (!this.$props.initImages) {
                this.$emit("updateImgFiles", this.imageFiles);
            } else {
                this.$emit("editImgFiles", this.imageObjs, this.deletedFiles);
            }
        },

        downloadedImageCounter: function() {
            // This is only ran if we are editing (and thus there are props.)
            if (this.$props.initImages) {
                if (this.downloadedImageCounter >= this.$props.initImages.length) {
                    this.downloadedImageUrls.sort((a, b) => a.order - b.order)

                    this.downloadedImageUrls.forEach(img => {
                        this.imageObjs.push({ id: img.order, tempUrl: img.imgUrl, file: null, path: img.imgPath });
                    })

                    this.imgIterator = this.imageObjs.length;
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

    .editImageContainer {
        padding: 0;
    }
</style>