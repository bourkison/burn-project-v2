<template>
    <v-card v-if="!isLoading" outlined>
        <v-carousel height="auto" v-model="carouselModel" show-arrows-on-hover hide-delimiter-background>
            <v-carousel-item class="carouselImage" v-for="img in imgUrls" :key="img.order" eager>
                <v-img :src="img.imgUrl" eager/>
            </v-carousel-item>
        </v-carousel>
        <v-container>
            <div>{{ postData.content }}</div>
        </v-container>
    </v-card>
    <v-card v-else outlined min-height="200">
        <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
    </v-card>
</template>

<script>
import { db, storage } from '../../firebase'

export default {
    name: 'ViewPostMin',
    props: {
        postId: {
            type: String,
            required: true
        }
    },

    data() {
        return {
            isLoading: true,
            postData: {},
            imgUrls: [],

            // Firebase:
            downloadedImageCounter: 0,

            // Vuetify:
            carouselModel: 0
        }
    },

    mounted: function() {
        db.collection("posts").doc(this.$props.postId).get().then(postDoc => {
            this.postData = postDoc.data();

            if (this.postData.imgPaths.length > 0) {
                let i = 0;
                this.postData.imgPaths.forEach(imgPath => {
                    this.downloadImage(imgPath, i);
                    i ++;
                })
            } else {
                this.isLoading = false;
            }
        })
    },

    methods: {
        downloadImage: function(ref, order) {
            storage.ref(ref).getDownloadURL().then(url => {
                this.imgUrls.push({ order: order, imgUrl: url });
                this.downloadedImageCounter ++;
            })
        }
    },

    watch: {
        downloadedImageCounter: function() {
            if (this.downloadedImageCounter >= this.postData.imgPaths.length) {
                this.imgUrls.sort((a, b) => a.order - b.order);
                this.isLoading = false;
            }
        }
    }
}
</script>