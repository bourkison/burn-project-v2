<template>
    <v-card outlined>
        <v-container>
            <v-file-input class="imageInput" prepend-icon="mdi-camera" chips clear-icon="" multiple label="Add Up to 10 photos and/or a video." v-model="imageFiles" append-icon="mdi-close" @change="handleFileUpload" @click:append="handleFileClose" ></v-file-input>
            <v-row justify="center" align="center" id="sortableContainer">
                <v-col class="sortableCol" cols="12" md="4" v-for="image in imageObjs" :key="image.id">
                    <v-card outlined>
                        <img :src="image.tempUrl"/>
                        <div align="center" style="padding: 10px;">
                            <v-icon @click="deleteImage(image.id)">mdi-delete-outline</v-icon>
                        </div>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </v-card>
</template>

<script>
import Sortable from 'sortablejs'

export default {
    name: 'ExerciseImageUploader',
    data() {
        return {
            imageObjs:  [],
            imgIterator: 0,

            // Sortable:
            sortable: null,
            sortableOptions: {
                animation: 300,
                onEnd: this.changeOrder
            },

            // Vuetify:
            imageFiles: []
        }
    },

    methods: {
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