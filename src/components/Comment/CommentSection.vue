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
import { db, fv, functions } from '@/firebase'
import Comment from '@/components/Comment/Comment.vue'

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
            isLiking: false,
            isFollowing: false,

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

            numShards: 10,

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
        generateId: function(n) {
            let randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let id = '';
            // 7 random characters
            for (let i = 0; i < n; i++) {
                id += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
            }
            return id;
        },

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

        callLikeFunction: function() {
            const createLike = functions.httpsCallable("createLike");
            const user = { username: this.$store.state.userProfile.docData.username, profilePhotoUrl: this.$store.state.userProfile.docData.profilePhotoUrl };
            
            createLike({ collection: this.collectionPathString, type: this.pageType, docId: this.docId, user: user })
            .then(result => {
                console.log("Like created", result);
            })
            .catch(e => {
                console.error("Error liking", e);
            })
        },

        handleLike: function() {
            // Check we're not already in the process of liking.
            if (!this.isLiking) {
                this.isLiking = true;
                const batch = db.batch();
                const timestamp = new Date();

                // Check to see if we like or unlike.
                if (!this.$props.isLiked) {
                    // Add like.                    
                    this.likeIcon = "mdi-heart";
                    this.likeIconColor = "red darken-2";

                    const likeId = this.generateId(16)

                    // First add to relevant collection/document.
                    batch.set(this.collectionPath.doc(this.docId).collection("likes").doc(likeId), {
                        createdBy: { 
                            username: this.$store.state.userProfile.docData.username,
                            id: this.$store.state.userProfile.data.uid,
                            profilePhoto: this.$store.state.userProfile.docData.profilePhotoUrl 
                        }, 
                        createdAt: timestamp
                    });

                    // Create the like in the user document.
                    batch.set(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").doc(likeId), {
                        type: this.pageType,
                        id: this.docId,
                        createdAt: timestamp
                    });

                    // Increment one of the like counters.
                    batch.update(this.collectionPath.doc(this.docId).collection("counters").doc((Math.floor(Math.random() * this.numShards)).toString()), {
                        likeCount: fv.increment(1)
                    });

                    // Set last activity on this document.
                    batch.update(this.collectionPath.doc(this.docId), {
                        lastActivity: timestamp
                    });

                    // Commit the batch
                    batch.commit()
                    .then(() => {
                        this.$emit("likeToggle", likeId);
                        console.log("Liked");
                        this.isLiking = false;
                    })
                    .catch(e => {
                        console.error("Error liking", this.docId, e);
                        this.isLiking = false;
                    })
                } else {
                    // Delete like.
                    this.likeIcon = "mdi-heart-outline";
                    this.likeIconColor = "";

                    // First delete like from relevant collection.
                    batch.delete(this.collectionPath.doc(this.docId).collection("likes").doc(this.$props.isLiked));

                    // Then delete from user document.
                    batch.delete(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("likes").doc(this.$props.isLiked));

                    // Decrement one of the like counters.
                    batch.update(this.collectionPath.doc(this.docId).collection("counters").doc((Math.floor(Math.random() * this.numShards)).toString()), {
                        likeCount: fv.increment(-1)
                    });

                    // Commit the batch.
                    batch.commit()
                    .then(() => {
                        this.$emit("likeToggle", "");
                        console.log("Unliked");
                        this.isLiking = false;
                    })
                    .catch(e => {
                        console.error("Error unliking", this.docId, e);
                        this.isLiking = false;
                    })
                }
            }

            document.activeElement.blur();
        },

        handleFollow: function() {
            if (this.isFollowable && !this.isFollowing) {
                this.isFollowing = true;
                const batch = db.batch();
                const timestamp = new Date();

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
                    batch.set(this.collectionPath.doc(this.docId).collection("follows").doc(this.$store.state.userProfile.data.uid), {
                        createdBy: { 
                            username: this.$store.state.userProfile.docData.username,
                            id: this.$store.state.userProfile.data.uid,
                            profilePhoto: this.$store.state.userProfile.docData.profilePhotoUrl 
                        }, 
                        createdAt: timestamp
                    })

                    // Then add to the user document.
                    batch.set(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection(this.collectionPathString).doc(this.docId), {
                        createdAt: timestamp,
                        isFollow: true,
                    })

                    // Increment the follow counter.
                    batch.update(this.collectionPath.doc(this.docId).collection("counters").doc((Math.floor(Math.random() * this.numShards)).toString()), {
                        followCount: fv.increment(1)
                    })

                    // Update lastActivity
                    batch.update(this.collectionPath.doc(this.docId), {
                        lastActivity: timestamp
                    });

                    // Commit the batch.
                    batch.commit()
                    .then(() => {
                        this.isFollowed = this.docId;
                        this.snackbarHandler(true);
                        this.followCounter ++;
                        this.isFollowing = false;
                    })
                    .catch(e => {
                        console.error("Error creating follow:", e);
                    })
                } else {
                    // Unfollow.
                    this.followIcon = "mdi-plus-circle-outline";
                    this.followIconColor = "";

                    // First delete from relevant collection.
                    batch.delete(this.collectionPath.doc(this.docId).collection("follows").doc(this.$store.state.userProfile.data.uid));

                    // Then delete from users collection.
                    batch.delete(db.collection("users").doc(this.$store.state.userProfile.data.uid).collection(this.collectionPath).doc(this.isFollowed));

                    // Decrement the follow counter.
                    batch.update(this.collectionPath.doc(this.docId).collection("counters").doc((Math.floor(Math.random() * this.numShards)).toString()), {
                        followCount: fv.increment(-1)
                    });

                    // Commit the batch.
                    batch.commit()
                    .then(() => {
                        this.isFollowed = '';
                        this.snackBarHandler(true);
                        this.followCounter --;
                        this.isFollowing = false;
                    })
                    .catch(e => {
                        console.error("Error deleting follow:", e);
                        this.isFollowing = false;
                    });
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