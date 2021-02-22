<template>
    <v-expansion-panels>
        <v-expansion-panel>
            <v-expansion-panel-header v-if="!isLoading"><strong>{{ exercise.name }}</strong></v-expansion-panel-header>
            <v-expansion-panel-header v-else>Loading...</v-expansion-panel-header>
            <v-expansion-panel-content v-if="!isLoading">
                <v-sheet>
                    <div v-if="imgUrls.length > 1">
                        <v-carousel v-model="carouselModel" show-arrows-on-hover hide-delimiter-background height="auto">
                            <v-carousel-item class="carouselImage" v-for="(img, index) in imgUrls" :key="index" @click.stop="popUpImage(img)" eager>
                                <v-img :src="img" eager/>
                            </v-carousel-item>
                        </v-carousel>
                    </div>
                    <div v-else-if="imgUrls.length > 0">
                        <v-img :src="imgUrls[0]" eager />
                    </div>
                    <v-container v-html="compiledMarkdown"></v-container>
                </v-sheet>
            </v-expansion-panel-content>
            <v-expansion-panel-content v-else><div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div></v-expansion-panel-content>
        </v-expansion-panel>
    </v-expansion-panels>
</template>

<script>
import { db, storage } from '@/firebase'
import * as marked from 'marked'

export default {
    name: 'ExerciseShare',
    props: {
        exerciseId: {
            type: String,
            required: false
        },
        exerciseObj: {
            type: Object,
            required: false
        }
    },

    data() {
        return {
            exercise: {},
            imgUrls: [],
            isLoading: true,

            // Vuetify:
            carouselModel: 0
        }
    },

    computed: {
        compiledMarkdown: function() {
            return marked(this.exercise.description);
        }
    },

    mounted: function() {
        if (this.$props.exerciseId) {
            db.collection("exercises").doc(this.$props.exerciseId).get()
            .then(exerciseDoc => {
                let data = exerciseDoc.data();
                data.id = exerciseDoc.id;
                this.exercise = data;

                this.downloadImages();
            })
        } else {
            this.exercise = this.$props.exerciseObj;
            this.downloadImages();
        }
    },

    methods: {
        downloadImages: function() {
            let imageDownloadPromises = [];

            this.exercise.filePaths.forEach(filePath => {
                imageDownloadPromises.push(storage.ref(filePath).getDownloadURL());
            })

            Promise.all(imageDownloadPromises)
            .then(urls => {
                urls.forEach(url => {
                    this.imgUrls.push(url);
                })
                this.isLoading = false;
            })
        }
    }
}
</script>