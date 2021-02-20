<template>
    <v-card outlined>
        <v-container>
            <v-file-input v-if="!initImages" accept="image/png,image/jpg,image/jpeg" class="imageInput" prepend-icon="mdi-camera" clear-icon="" label="Add Up to 10 photos and/or a video." v-model="imageFiles" append-icon="mdi-close" @change="handleFileUpload" @click:append="handleFileClose" ></v-file-input>
            <v-file-input v-else accept="image/png,image/jpg,image/jpeg" class="imageInput" prepend-icon="mdi-camera" clear-icon="" label="Add Up to 10 photos and/or a video." v-model="additionalFiles" append-icon="mdi-close" @change="handleEditFileUpload" @click:append="handleEditFileClose" ></v-file-input>
            <v-row justify="center" align="center" id="sortableContainer">
                <v-col class="sortableCol" cols="12" md="4" v-for="image in imageObjs" :key="image.id">
                    <v-card outlined>
                        <img :src="image.tempUrl"/>
                        <div align="center" style="padding: 10px;">
                            <v-icon v-if="!image.path" @click.stop="editImageToggle(image.id)">mdi-image-edit-outline</v-icon>
                            <v-icon @click="deleteImage(image.id)">mdi-delete-outline</v-icon>
                        </div>
                    </v-card>
                </v-col>
                <v-col v-if="isLoading">
                    <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
                </v-col>
                
            </v-row>
        </v-container>

        <v-dialog max-height="600" max-width="900" v-model="editingImageDialogue" persistent eager>
            <v-card v-for="img in imagesToEdit" :key="img.id">
                <div v-if="img.dialogueOpen">
                    <v-card-title>
                        Edit Image
                    </v-card-title>
                    <v-card-text ref="dialogueContainer">
                        <ImageEditorDialogue :imgUrl="img.url" :imgId="img.id" @outputEdit="outputEdit"></ImageEditorDialogue>
                    </v-card-text>
                </div>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script>
import { storage } from '@/firebase'
import Sortable from 'sortablejs'

import ImageEditorDialogue from '@/components/ImageEditorDialogue.vue'

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

            // Cropper:
            imagesToEdit: [],
            imageEditIncrementor: 0,
        }
    },

    props: {
        initImages: {
            type: Array,
            required: false
        }
    },

    created: function() {
        this.imagesToEdit.push({ id: this.imageEditIncrementor, url: null, dialogueOpen: false });
    },

    mounted: function() {
        if (this.$props.initImages) {
            this.isLoading = true;
            let i = 0;

            this.$props.initImages.forEach(img => {
                this.downloadImage(img, i);
                i ++;
                this.imageEditIncrementor ++;
            })

            this.imagesToEdit[0].id = this.imageEditIncrementor;
        }
    },

    methods: {
        downloadImage: function(ref, order) {
            storage.ref(ref).getDownloadURL().then(url => {
                this.downloadedImageUrls.push({ order: order, imgUrl: url, imgPath: ref })
                this.downloadedImageCounter ++;
            })
        },

        handleFileUpload: function(e) {
            this.imageFiles = e;
            // this.imagesToEdit.push({ id: this.imageEditIncrementor, url: URL.createObjectURL(e), dialogueOpen: true });
            this.imagesToEdit[this.imageEditIncrementor].url = URL.createObjectURL(e);
            this.imagesToEdit[this.imageEditIncrementor].dialogueOpen = true;
            this.editingImageDialogue = true;
            console.log(this.imagesToEdit);
        },

        handleEditFileUpload: function(e) {
            this.additionalFiles = e;
            this.imagesToEdit[this.imageEditIncrementor - this.downloadedImageCounter].url = URL.createObjectURL(e);
            this.imagesToEdit[this.imageEditIncrementor - this.downloadedImageCounter].dialogueOpen = true;
            this.editingImageDialogue = true;
            
        },

        deleteImage: function(id) {
            let index = this.imageObjs.findIndex(x => x.id === id);            

            if (!this.$props.initImages) {
                this.imageObjs.splice(index, 1);
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

        editImageToggle: function(id) {
            let imageEditIndex = this.imagesToEdit.findIndex(x => x.id === id);

            this.editingImageDialogue = true;
            this.imagesToEdit[imageEditIndex].dialogueOpen = true;
            console.log(imageEditIndex);
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
                this.imageObjs.splice(e.newIndex, 0, this.imageObjs.splice(e.oldIndex, 1)[0]);
                console.log(this.imageObjs);
            }
        },

        // outputEdit is function emitted in ImageEditorDialogue.vue
        // when image added.
        outputEdit: function(s, id) {
            // console.log(s);
            console.log(id);
            this.editingImageDialogue = false;
            this.imagesToEdit[id - this.downloadedImageCounter].dialogueOpen = false;

            if (id != this.imageEditIncrementor) {
                // If this is the case, then we are editing an already added image.
                let imageObjsIndex = this.imageObjs.findIndex(x => x.id === id);
                this.imageObjs[imageObjsIndex] = { id: id, file: s, tempUrl: s, path: null }
            } else {
                // Else we are adding a new one.
                this.imageObjs.push({ id: id, file: s, tempUrl: s, path: null })
                this.imageEditIncrementor ++;
                this.imagesToEdit.push({ id: this.imageEditIncrementor, url: null, dialogueOpen: false });
            }
            
            this.imageFiles = [];
            document.activeElement.blur();
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
                this.$emit("updateImgFiles", this.imageObjs);
            } else {
                console.log(this.imageObjs);
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

    .imageInput:hover {
        cursor: pointer !important;
    }

    .imageInput label:hover {
        cursor: pointer;
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