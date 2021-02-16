<template>
    <v-card outlined>
        <v-container>
            <div style="margin-bottom:20px;"><h3>New Post</h3></div>
            <v-row justify="center" align="center" id="sortableContainer">
                <v-col class="sortableCol" cols="12" md="4" v-for="image in imageObjs" :key="image.id">
                    <v-card outlined>
                        <img :src="image.tempUrl"/>
                        <div align="center" style="padding:10px;">
                            <v-icon v-if="!image.path" @click.stop="editImageToggle(image.id)">mdi-image-edit-outline</v-icon>
                            <v-icon @click="deleteImage(image.id)">mdi-delete-outline</v-icon>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
            <v-textarea label="Add text here..." auto-grow counter></v-textarea>
            <v-file-input v-model="imageFiles" @change="handleFileUpload" style="display:inline;margin:0;padding:0;" accept="image/png,image/jpg,image/jpeg" hide-input></v-file-input>
        </v-container>

        <v-dialog max-height="600" max-width="900" v-model="editingImageDialogue" persistent eager>
            <v-card v-for="img in imagesToEdit" :key="img.id">
                <div v-if="img.dialogueOpen">
                    <v-card-title>Edit Image</v-card-title>
                    <v-card-text ref="dialogueContainer">
                        <ImageEditorDialogue :imgUrl="img.url" :imgId="img.id" @outputEdit="outputEdit"></ImageEditorDialogue>
                    </v-card-text>
                </div>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script>
import Sortable from 'sortablejs'

import ImageEditorDialogue from '../../components/ImageEditorDialogue.vue'

export default {
    name: 'NewPost',
    components: { ImageEditorDialogue },
    data() {
        return {
            imageFiles: [],
            imagesToEdit: [],
            imageEditIncrementor: 0,
            imageObjs: [],

            // Sortable:
            sortable: null,
            sortableOptions: {
                animation: 300,
                onEnd: this.changeOrder
            },

            // Vuetify:
            editingImageDialogue: false
        }
    },

    created: function() {
        this.imagesToEdit.push({ id: this.imageEditIncrementor, url: null, dialogueOpen: false });
    },

    methods: {
        handleFileUpload: function(e) {
            this.imageFiles = e;
            this.imagesToEdit[this.imageEditIncrementor].url = URL.createObjectURL(e);
            this.imagesToEdit[this.imageEditIncrementor].dialogueOpen = true;
            this.editingImageDialogue = true;
        },

        outputEdit: function(s, id) {
            this.editingImageDialogue = false;
            console.log(this.imagesToEdit)
            this.imagesToEdit[id].dialogueOpen = false;

            if (id != this.imageEditIncrementor) {
                let imageObjsIndex = this.imageObjs.findIndex(x => x.id === id);
                this.imageObjs[imageObjsIndex] = { id: id, file: s, tempUrl: s, path: null }
            } else {
                this.imageObjs.push({ id: id, file: s, tempUrl: s, path: null });
                this.imageEditIncrementor ++;
                this.imagesToEdit.push({ id: this.imageEditIncrementor, url: null, dialogueOpen: false });
            }
        },

        editImageToggle: function(id) {
            let imageEditIndex = this.imagesToEdit.findIndex(x => x.id === id);
            this.editingImageDialogue = true;
            this.imagesToEdit[imageEditIndex].dialogueOpen = true;
        },

        deleteImage: function(id) {
            let index = this.imageObjs.findIndex(x => x.id === id);
            this.imageObjs.splice(index, 1);
        },

        changeOrder: function(e) {
            if (e.newIndex !== e.oldIndex) {
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
        }
    }
}
</script>

<style scoped>
    .sortableCol img {
        width: 100%;
        height: auto;
    }

    .sortableCol img:hover {
        cursor: pointer;
    }
</style>