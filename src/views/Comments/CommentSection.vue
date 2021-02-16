<!--
    comment:
    {
        content: string,
        createdBy: object, // { id: userid, username: username }
        createdAt: Timestamp,

        likes: array of user IDs,
    }
-->

<template>
    <v-container class="commentSection">
        <span>{{ likeCount }} <span v-if="likeCount != 1">likes</span><span v-else>like</span> | {{ commentCounter }} <span v-if="commentCount != 1">comments</span><span v-else>comment</span> <span v-if="followableComponent">| {{ followCounter }} <span v-if="followCounter != 1">follows</span><span v-else>follow</span></span></span>
        <v-row class="lcsCont">
            <v-col cols="12" sm="6">
                <v-icon large @click="handleLike" :color="likeIconColor">{{ likeIcon }}</v-icon>
                <v-icon large @click="toggleComments">mdi-comment-outline</v-icon>
                <v-icon large>mdi-share-outline</v-icon>
            </v-col>
            <v-col cols="!2" sm="6" align="right">
                <v-icon v-if="isFollowable" large @click="handleFollow" :color="followIconColor">mdi-plus-circle-outline</v-icon>
            </v-col>
        </v-row>
        <div v-if="viewComments">
            <v-card v-if="comments.length == 0"><em>No comments have been added. Add the first one?</em></v-card>
            <Comment v-for="comment in comments" :comment="comment" :collection-path="collectionPath" :doc-id="docId" :key="comment.id"></Comment>
            <v-form style="padding:10px" @submit.prevent="addComment">
                <v-text-field v-model="newComment.content" label="New Comment" append-icon="mdi-send" @click:append="addComment"></v-text-field>
            </v-form>

            <div align="center"><v-btn @click="loadComments" :loading="isLoading" v-if="commentCounter > comments.length">Load Comments</v-btn></div>
        </div>

        <v-snackbar
            v-model="snackbar"
            :timeout="2000"
        >
            {{ snackbarText }}

            <template v-slot:action="{ attrs }">
                <v-btn
                    color="red"
                    text
                    v-bind="attrs"
                    @click="snackbarHandler"
                >Dismiss</v-btn>                
            </template>
        </v-snackbar>
    </v-container>
</template>

<script>
import { db, fv } from '../../firebase'
import Comment from './Comment.vue'

export default {
    name: 'CommentSection',
    components: { Comment },
    props: {
        exerciseId: {
            type: String,
            required: false
        },
        workoutId: {
            type: String,
            required: false
        },
        postId: {
            type: String,
            required: false
        },
        isLiked: {
            type: String,
            required: true
        },
        followableComponent: {
            type: Boolean,
            required: true
        },
        likeCount: {
            type: Number,
            required: true
        },
        recentComments: {
            type: Array,
            required: true
        },
        commentCount: {
            type: Number,
            required: true
        },
        followCount: {
            type: Number,
            required: false
        }
    },
    data() {
        return {
            isLoading: false,
            collectionPath: null,
            comments: [],
            newComment: {},
            commentsAllowed: true,
            docId: null,
            pageType: '',
            viewComments: false,
            errorMessage: '',
            isFollowable: false,
            isFollowed: '',
            commentCounter: 0,

            // Vuetify:
            likeIcon: '',
            likeIconColor: '',
            followIcon: '',
            followIconColor: '',
            snackbar: '',
            snackbarText: '',
            initLoad: true
        }
    },

    created: function() {
        // Database path based on what ID is pased through.
        if (this.$props.exerciseId) {
            this.collectionPath = db.collection("exercises");
            this.pageType = "exercise";
            this.collectionPathString = "exercises";
            this.docId = this.$props.exerciseId;
        } else if (this.$props.workoutId) {
            this.collectionPath = db.collection("workouts");
            this.pageType = "workout";
            this.collectionPathString = "workouts";
            this.docId = this.$props.workoutId;
        } else if (this.$props.postId) {
            this.collectionPath = db.collection("posts");
            this.pageType = "post";
            this.collectionPathString = "posts";
            this.docId = this.$props.postId;
        } else {
            console.warn("NO PATH PASSED THROUGH TO COMMENT SECTION.")
        }

        // Check if liked or not.
        if (this.isLiked) {
            this.likeIcon = "mdi-heart";
            this.likeIconColor = "red darken-2";
        } else {
            this.likeIcon = "mdi-heart-outline";
            this.likeIconColor = "";
        }

        // Check if followed or not.
        if (this.$props.followableComponent) {
            db.collection("users").doc(this.$store.state.userProfile.data.uid).collection(this.collectionPathString).doc(this.docId).get().then(docRef => {
                if (docRef.exists) {
                    if (!docRef.data().isFollow) {
                        this.isFollowable = false;
                    } else {
                        this.isFollowable = true;
                    }
                    this.isFollowed = docRef.id; // Collection document ID.
                } else {
                    this.isFollowable = true;
                    this.isFollowed = '';
                }
            }).catch(e => {
                this.errorMessage = "Error checking if following or not: " + e;
                console.log(this.errorMessage);
            })
        }
        
        this.commentCounter = this.$props.commentCount;
        this.followCounter = this.$props.followCount;
        this.comments = this.$props.recentComments;
    },

    methods: {
        toggleComments: function() {
            this.viewComments = !this.viewComments;
            document.activeElement.blur();
        },

        snackbarHandler: function(t) {
            if (t === true) {
                this.snackbar = true;
                if (this.isFollowed) {
                    this.snackbarText = this.pageType.charAt(0).toUpperCase() + this.pageType.slice(1) + " followed!";
                } else {
                    this.snackbarText = this.pageType.charAt(0).toUpperCase() + this.pageType.slice(1) + " unfollowed!";
                } 
            } else {
                this.snackbar = false;
            }
        },

        handleLike: function() {
            if (!this.$props.isLiked) {
                // Add like.
                this.likeIcon = "mdi-heart";
                this.likeIconColor = "red darken-2";

                // First create the like in the relevant document.
                let likePayload = { createdBy: {username: this.$store.state.userProfile.docData.username, id: this.$store.state.userProfile.data.uid }, createdAt: new Date() }
                this.collectionPath.doc(this.docId).collection("likes").add(likePayload).then(likeRef => {
                    // Increment the like counter on this document.
                    this.collectionPath.doc(this.docId).update({ likeCount: fv.increment(1) }).then(() => {
                        // Then create the like in the user document.
                        likePayload = { type: this.pageType, id: this.docId, createdAt: likePayload.createdAt }
                        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").doc(likeRef.id).set(likePayload).then(() => {
                            this.$emit("likeToggle", likeRef.id);
                        }).catch(e => {
                            console.log("Error creating like. Error pushing to user's likes:", e)
                        })
                    }).catch(e => {
                        console.log("Error creating like. Error incrementing likeCount", e);
                    })
                }).catch(e => {
                    console.log("Error creating like. Error pushing to documents' likes", e);
                })
            } else {
                // Delete like.
                this.likeIcon = "mdi-heart-outline";
                this.likeIconColor = "";

                // First delete like in the relevant document.
                this.collectionPath.doc(this.docId).collection("likes").doc(this.$props.isLiked).delete().then(() => {
                    // Decrement the like counter on this document.
                    this.collectionPath.doc(this.docId).update({ likeCount: fv.increment(-1) }).then(() => {
                        // Now delete like in the user document.
                        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").doc(this.$props.isLiked).delete().then(() => {
                            this.$emit("likeToggle", "");
                        }).catch(e => {
                            this.errorMessage = "Error unliking. Error deleting from user's likes: " + e;
                            console.log(this.errorMessage);
                        });
                    })
                }).catch(e => {
                    this.errorMessage = "Error unliking. Error deleting from document' likes" + e;
                    console.log(this.errorMessage);
                })
            }

            document.activeElement.blur();
        },

        handleFollow: function() {
            if (this.isFollowable) {
                // Following is basically the same as a like.
                // Though instead of adding to a "likes" collection in the user doc, we just add to the relevant collection.
                // That way we differ between created and followed by the createdBy value.
                // In the relevant collection, follow IDs will be the User ID.
                // In the User collection, follows will be the document ID.
                if (!this.isFollowed) {
                    // Follow.
                    this.followIcon = "mdi-plus-circle";
                    this.followIconColor = "light-green ligten-1";

                    // First add to the relevant document.
                    let followPayload = { createdBy: { username: this.$store.state.userProfile.docData.username, id: this.$store.state.userProfile.data.uid }, createdAt: new Date() }
                    this.collectionPath.doc(this.docId).collection("follows").doc(this.$store.state.userProfile.data.uid).set(followPayload).then(() => {
                        followPayload.isFollow = true;
                        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection(this.collectionPathString).doc(this.docId).set(followPayload).then(() => {
                            this.isFollowed = this.docId;
                            this.snackbarHandler(true);
                            this.followCounter ++;
                        }).catch(e => {
                            this.errorMessage = "Error creating follow. Error pushing to user's follows: " + e;
                            console.log(this.errorMessage);
                        })
                    }).catch(e => {
                        this.errorMessage = "Error creating follow. Error pushing to document's follows: " + e;
                        console.log(this.errorMessage);
                    })
                } else {
                    // Unfollow.
                    this.followIcon = "mdi-plus-circle-outline";
                    this.followIconColor = "";

                    // Delete the follow document in the relevant collection.
                    this.collectionPath.doc(this.docId).collection("follows").doc(this.$store.state.userProfile.data.uid).delete().then(() => {
                        // Delete the document from the users collection.
                        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection(this.collectionPathString).doc(this.isFollowed).delete().then(() => {
                            this.isFollowed = '';
                            this.snackbarHandler(true);
                            this.followCounter --;
                        }).catch(e => {
                            this.errorMessage = "Error deleting follow. Error deleting from user's follows: " + e;
                            console.log(this.errorMessage);
                        })
                    }).catch(e => {
                        this.errorMessage = "Error deleting follow. Error deleting from document's follows: " + e;
                        console.log(this.errorMessage);
                    })
                }    
                document.activeElement.blur();
            }
        },

        loadComments: function() {
            this.isLoading = true;
            this.collectionPath.doc(this.docId).collection("comments").orderBy("createdAt", "desc").get().then(commentSnapshot => {
                this.comments = [];
                commentSnapshot.forEach(comment => {
                    let c = comment.data();
                    c.id = comment.id;
                    this.comments.push(c);
                })
                this.isLoading = false;
                this.commentCounter = commentSnapshot.size;
            })
        },

        addComment: function() {
            if (this.newComment.content.trim() != "") {
                let payload = this.newComment;
                this.newComment = {};
                payload.createdBy = { id: this.$store.state.userProfile.data.uid, username: this.$store.state.userProfile.docData.username, profilePhotoUrl: this.$store.state.userProfile.docData.profilePhotoUrl }
                payload.createdAt = new Date();
                payload.likeCount = 0;

                // First add comment to the relevant collection.
                this.collectionPath.doc(this.docId).collection("comments").add(payload).then(commentRef => {
                    // Increment comment count.
                    this.collectionPath.doc(this.docId).update({ commentCount: fv.increment(1) }).then(() => {
                        // Now add comment to the user.
                        let commentPayload = { type: this.pageType, docId: this.docId, createdAt: new Date() }
                        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("comments").doc(commentRef.id).set(commentPayload).then(() => {
                            payload.id = commentRef.id;
                            this.comments.push(payload);
                            this.commentCounter ++;
                        }).catch(e => {
                            console.warn("Error adding comment to user:", e);
                        })
                    }).catch(e => {
                        console.warn("Error incrementing comment count:", e);
                    })
                }).catch(e => {
                    console.warn("Error adding comment to comments:", e);
                })
            } else {
                console.log("Comment can't be blank.");
                this.newComment = {}
            }
        }
    },

    watch: {
        // Alter the icon based on isLiked changes.
        isLiked: function(n, o) {
            if (n && n != o) {
                this.likeIcon = "mdi-heart";
                this.likeIconColor = "red darken-2";
            } else if (!n && n != o) {
                this.likeIcon = "mdi-heart-outline";
                this.likeIconColor = "";
            }
        },

        // Alter icon based on isFollowed changes.
        isFollowed: function(n, o) {
            if (n && n != o) {
                this.followIcon = "mdi-plus-circle";
                this.followIconColor = "light-green lighten-1"
            } else {
                this.followIcon = "mdi-plus-circle-outlined";
                this.followIconColor = "";
            }
        }
    }
}
</script>

<style scoped>
    .lcsCont {
        padding: 10px;
    }

    .lcsCont .v-icon {
        margin-right: 5px;
    }

    .commentSection .v-card {
        box-shadow: none;
        padding: 10px;

    }
</style>