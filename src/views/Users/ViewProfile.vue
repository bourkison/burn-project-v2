<template>
    <v-sheet class="mainSheet" min-height="70vh" rounded="lg">
        <v-container v-if="!isLoading">
            <v-row>
                <v-col cols="12" sm="3">
                    <v-avatar size="100%"><v-img aspect-ratio="1" :src="profileData.profilePhotoUrl"></v-img></v-avatar>
                </v-col>
                <v-col cols="12" sm="9">
                    <v-container>
                        <v-row style="align-items:center;">
                                <h1>{{ profileData.username }}</h1>
                                <v-spacer/>
                                <v-btn v-if="!isLoggedInUser && !isFollowed" text @click="handleFollow" style="margin-left:15px;" :loading="isFollowing">Follow</v-btn>
                                <v-btn v-else-if="!isLoggedInUser" text @click="handleFollow" style="margin-left:15px;" :loading="isFollowing">Unfollow</v-btn>
                        </v-row>
                        <v-row>
                            <v-col cols="12" sm="6">
                                <h3 align="center">{{ profileData.followerCount }} Followers</h3>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <h3 align="center">{{ profileData.followingCount }} Following</h3>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-col>
            </v-row>
            <v-row v-if="isLoggedInUser">
                <v-col cols="12" sm="12">
                    <PostNew @newPost="newPost" />
                </v-col>
            </v-row>
            <v-row v-for="postId in posts" :key="postId">
                <v-col cols="12" sm="12">
                    <PostComponent :postId="postId" />
                </v-col>
            </v-row>
        </v-container>
        <v-container v-else>
            <div align="center"><v-progress-circular indeterminate centered></v-progress-circular></div>
        </v-container>
    </v-sheet>
</template>

<script>
import { db, fv } from '../../firebase'

import PostNew from '@/components/Posts/PostNew.vue'
import PostComponent from '@/components/Posts/PostComponent.vue'

export default {
    name: 'ViewProfile',
    components: { PostNew, PostComponent },
    data() {
        return {
            isLoading: true,
            isLoggedInUser: false,
            isFollowed: false,
            profileData: {},
            posts: [],

            // Vuetify:
            isFollowing: false,
        }
    },

    created: function() {
        this.downloadUserData();
    },

    beforeRouteUpdate: function(to, from, next) {
        this.isLoading = true;
        this.isLoggedInUser = false;
        this.isFollowed = false;
        this.profileData = {};
        this.posts = [];
        next();
        this.downloadUserData();
    },

    methods: {
        downloadUserData: function() {
            if (this.$route.params.profileid === this.$store.state.userProfile.docData.username) {
                this.isLoggedInUser = true;
                this.profileData = this.$store.state.userProfile.docData;
                this.profileData.id = this.$store.state.userProfile.data.uid;
                this.downloadPosts();
            } else {
                console.log(this.$route.params.profileid);
                db.collection("users").where("username", "==", this.$route.params.profileid).get().then(querySnapshot => {
                    if (querySnapshot.size > 0) {
                        querySnapshot.forEach(user => {
                            // Check if logged in user has followed.
                            let d = user.data();
                            d.id = user.id;
                            this.profileData = d;

                            db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("following").doc(this.profileData.id).get().then(followingDoc => {
                                if (followingDoc.exists) {
                                    this.isFollowed = true;
                                } else {
                                    this.isFollowed = false;
                                }
                            })

                            this.downloadPosts();
                        })
                    } else {
                        // TODO: DISPLAY 404 NOT FOUND HERE.
                        console.log (404);
                        this.isLoading = false;
                    }
                })
            }
            
        },

        downloadPosts: function() {
            db.collection("users").doc(this.profileData.id).collection("posts").orderBy("createdAt", "desc").get().then(postsSnapshot => {
                postsSnapshot.forEach(post => {
                    this.posts.push(post.id);
                })

                this.isLoading = false;
            })
        },

        handleFollow: function() {
            this.isFollowing = true;

            if (!this.isFollowed) {
                // First add to this users followers.
                let payload = { createdBy: { username: this.$store.state.userProfile.docData.username, id: this.$store.state.userProfile.data.uid, profilePhoto: this.$store.state.userProfile.docData.profilePhotoUrl }, createdAt: new Date() }
                db.collection("users").doc(this.profileData.id).collection("followers").doc(this.$store.state.userProfile.data.uid).set(payload).then(() => {
                    // Increment follower count on the user.
                    db.collection("users").doc(this.profileData.id).update({ followerCount: fv.increment(1) }).then(() => {
                        // Add to logged in users following.
                        payload = { followedUser: { username: this.profileData.username, id: this.profileData.id, profilePhoto: this.profileData.profilePhotoUrl }, createdAt: payload.createdAt }
                        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("following").doc(this.profileData.id).set(payload).then(() => {
                            // Now increment following count on logged in user.
                            db.collection("users").doc(this.$store.state.userProfile.data.uid).update({followingCount: fv.increment(1)}).then(() => {
                                console.log("FOLLOWED USER");
                                this.isFollowing = false;
                                this.isFollowed = true;
                                this.profileData.followerCount ++;
                                this.$store.state.userProfile.docData.followingCount ++;
                            }).catch(e => {
                                console.warn("Error incrementing followingCount", e);
                                this.isFollowing = false;
                            })
                        }).catch(e => {
                            console.warn("Error adding this user to following collection", e);
                            this.isFollowing = false;
                        })
                    }).catch(e => {
                        console.warn("Error incrementing followerCount", e);
                        this.isFollowing = false;
                    })
                }).catch(e => {
                    console.warn("Error adding logged in user to follower collection", e);
                    this.isFollowing = false;
                })
            } else {
                // First delete from users followers.
                db.collection("users").doc(this.profileData.id).collection("followers").doc(this.$store.state.userProfile.data.uid).delete().then(() => {
                    // Decrement follower count on the user.
                    db.collection("users").doc(this.profileData.id).update({ followerCount: fv.increment(-1) }).then(() => {
                        // Delete from logged in user's following
                        db.collection("users").doc(this.$store.state.userProfile.data.uid).collection("following").doc(this.profileData.id).delete().then(() => {
                            // Decrement following count on logged in user.
                            db.collection("users").doc(this.$store.state.userProfile.data.uid).update({ followingCount: fv.increment(-1) }).then(() => {
                                console.log("UNFOLLOWED USER");
                                this.isFollowing = false;
                                this.isFollowed = false;
                                this.profileData.followerCount --;
                                this.$store.state.userProfile.docData.followingCount --;
                            }).catch(e => {
                                console.warn("Error decrementing followingCount", e);
                                this.isFollowing = false;
                            })
                        }).catch(e => {
                            console.warn("Error deleting user from following collection", e);
                            this.isFollowing = false;
                        })
                    }).catch(e => {
                        console.warn("Error decrementing followerCount", e);
                        this.isFollowing = false;
                    })
                }).catch(e => {
                    console.warn("Error deleting user from follower collection", e);
                    this.isFollowing = false;
                })
            }
        },

        newPost: function(p) {
            this.posts.unshift(p.id);
        }
    }
}
</script>