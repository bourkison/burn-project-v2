<template>
    <div>
        <v-row align="center" justify="center">
            <v-col cols="12" sm="1">
                <v-avatar v-if="comment.createdBy.profilePhotoUrl != null" min-width="32" min-height="32" style="width:unset;height:unset;">
                    <v-img aspect-ratio="1" width="100%" height="100%" :src="comment.createdBy.profilePhotoUrl"/>
                </v-avatar>
                <v-avatar v-else color="red darken-1" size="32">
                    <v-icon dark>mdi-account-circle</v-icon>
                </v-avatar>
            </v-col>
            <v-col cols="12" sm="10">
                <router-link :to="profilePath">{{ comment.createdBy.username }}</router-link>
                <p>{{ comment.content }}</p>
                <span v-if="comment.likeCount > 0">{{ comment.likeCount }} <span v-if="likeCount > 1">likes</span><span v-else>like</span></span>
            </v-col>
            <v-col cols="12" sm="1">
                <v-icon :color="likeIconColor" @click="handleLike">{{ likeIcon }}</v-icon>
            </v-col>
        </v-row>
    </div>
</template>

<script>
import { db } from '../../firebase'

export default {
    name: 'Comment',
    props: {
        comment: {
            required: true,
            type: Object
        },
        collectionPath: {
            required: true
        },
        docId: {
            required: true,
            type: String
        },
    },

    data() { 
        return {
            profilePath: '',
            isLiked: '',

            // Vuetify:
            likeIcon: 'mdi-heart-outline',
            likeIconColor: ''
        }
    },

    created: function() {
        // Build user profile link.
        this.profilePath = "/users/" + this.$props.comment.createdBy.id;

        // Check if the user has liked.
        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").where("id", "==", this.$vnode.key).get().then(likeSnapshot => {
            likeSnapshot.forEach(like => {
                if(like.exists) {
                    this.isLiked = like.id;
                }
            })
        })


    },

    methods: {
        handleLike: function() {
            if (!this.isLiked) {
                // Like
                this.likeIcon = "mdi-heart";
                this.likeIconColor = "red darken-2";

                let likePayload = { createdBy: { username: this.$store.state.userProfile.docData.username, id: this.$store.state.userProfile.data.uid}, createdAt: new Date() }
                // Create like in the Comments collection.
                this.$props.collectionPath.doc(this.$props.docId).collection("comments").doc(this.$vnode.key).collection("likes").add(likePayload).then(likeRef => {
                    // Then create like in the user document.
                    likePayload = { type: "comment", id: this.$vnode.key, createdAt: likePayload.createdAt }
                    db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").doc(likeRef.id).set(likePayload).then(() => {
                        this.isLiked = likeRef.id;
                        this.comment.likeCount ++;
                    }).catch(e => {
                        this.errorMessage = "Error creating like. Error pshing to user's likes: " + e;
                        console.log(e);
                    })
                }).catch(e => {
                    this.errorMessage = "Error creating like. Error pushing to comment's likes: " + e;
                    console.log(e);
                })
            } else {
                // Unlike
                this.likeIcon = "mdi-heart-outline";
                this.likeIconColor = "";

                // First delete like in comments collection.
                this.$props.collectionPath.doc(this.$props.docId).collection("comments").doc(this.$vnode.key).collection("likes").doc(this.isLiked).delete().then(() => {
                    // Now delete like in the user document.
                    db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").doc(this.isLiked).delete().then(() => {
                        this.isLiked = '';
                        this.commentCount.likeCount --;
                    }).catch(e => {
                        this.errorMessage = "Error deleting like. Error deleting in user document: " + e;
                        console.log(this.errorMessage);
                    })
                }).catch(e => {
                    this.errorMessage = "Error deleting like. Error deleting in comment document: " + e;
                    console.log(this.errorMessage);
                })
            }
            
            document.activeElement.blur();
        }
    },

    watch: {
        isLiked: function(n, o) {
            if (n && n != o) {
                this.likeIcon = "mdi-heart";
                this.likeIconColor = "red darken-2";
            } else if (!n && n != o) {
                this.likeIcon = "mdi-heart-outline";
                this.likeIconColor = "";
            }   
        }
    }
}
</script>