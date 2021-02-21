<template>
    <v-card>
        <v-container class="innerCont" style="overflow-x:hidden;">
            <v-form @submit.prevent="signUp">
                <h1 class="text-center">Sign Up</h1>
                <v-row align="center" justify="center">
                    <v-col cols="12" md="3">
                        <label for="image-input">
                            <v-avatar v-if="!profilePhotoUrl" color="red darken-1" size="128" class="profilePhoto">
                                <v-icon dark>mdi-account-circle</v-icon>
                            </v-avatar>
                            <v-avatar v-else size="128">
                                <img :src="profilePhotoUrl"  class="profilePhoto" />
                            </v-avatar>
                        </label>
                        <v-file-input id="image-input" v-model="profilePhotoFile" style="display:none;" @change="handleFileUpload"/>
                    </v-col>
                    <v-col cols="12" md="9">
                        <v-text-field 
                            v-model="signUpForm.email" 
                            label="Email" 
                            :rules="[rules.required]" >
                        </v-text-field>
                        <!-- TODO: Add asynchronous rule to check for username uniqueness. -->
                        <v-text-field 
                            v-model="signUpForm.username" 
                            label="Username" 
                            :rules="[rules.required]" >
                        </v-text-field>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col rows="12" md="6">
                        <v-text-field 
                            v-model="signUpForm.password" 
                            :rules="[rules.required, rules.min]"
                            :type="showPassword ? 'text' : 'password'"
                            label="Password"
                            class="input-group--focused"
                        ></v-text-field>
                    </v-col>
                    <v-col rows="12" md="6">
                        <v-text-field
                            v-model="signUpForm.confPassword"
                            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                            :rules="[rules.required, rules.passMatch, rules.min]"
                            :type="showPassword ? 'text' : 'password'"
                            label="Confirm Password"
                            class="input-group--focused"
                            @click:append="showPassword = !showPassword"
                        ></v-text-field>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-text-field
                            v-model="signUpForm.firstName"
                            label="First Name"
                            :rules="[rules.required]"
                        ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                        <v-text-field
                            v-model="signUpForm.surname"
                            label="Surname"
                            :rules="[rules.required]"
                        ></v-text-field>
                    </v-col>                                
                </v-row>
                <v-menu
                    ref="menu"
                    v-model="birthdayMenu"
                    :close-on-content-click="false"
                    transition="scale-transition"
                    offset-y
                    min-width="auto"
                >
                    <template v-slot:activator="{on, attrs}">
                        <v-text-field
                            v-model="signUpForm.dob"
                            label="Birthday"
                            prepend-icon="mdi-calendar"
                            readonly
                            v-bind="attrs"
                            v-on="on"
                        ></v-text-field>
                    </template>
                    <v-date-picker
                        ref="picker"
                        v-model="signUpForm.dob"
                        :max="new Date().toISOString().substr(0,10)"
                        min="1921-01-01"
                        @change="inputBirthday"
                    ></v-date-picker>
                </v-menu>
                <v-row>
                    <v-col rows="12" md="4">
                        <v-text-field
                            v-model="signUpForm.height"
                            label="Height"
                            :rules="[rules.required]"
                        ></v-text-field>
                    </v-col>
                    <v-col rows="12" md="2">
                        <v-select v-model="signUpForm.heightUnit" :items="['cm', 'inches']" :rules="[rules.required]"></v-select>
                    </v-col>
                    <v-col rows="12" md="4">
                        <v-text-field
                            v-model="signUpForm.weight"
                            label="Weight"
                            :rules="[rules.required]"
                        ></v-text-field>
                    </v-col>
                    <v-col rows="12" md="2">
                        <v-select v-model="signUpForm.weightUnit" :items="['kg', 'lbs']" :rules="[rules.required]"></v-select>
                    </v-col>
                </v-row>
                <v-select v-model="signUpForm.country" :items="countryList" label="Country" :rules="[rules.required]"></v-select>
                <input type="select" style="visibility:hidden;"/>
            </v-form>
        </v-container>
        <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="closeSignUp">Close</v-btn>
            <v-btn color="blue darken-1" text @click="signUp" :loading="isLoading">Sign Up</v-btn>
        </v-card-actions>

        <v-dialog max-height="600" max-width="900" v-model="editingImageDialogue" persistent eager>
            <v-card>
                <div v-if="imageToEdit.dialogueOpen">
                    <v-card-title>Edit Image</v-card-title>
                    <v-card-text ref="dialogueContainer">
                        <ImageEditorDialogue :imgUrl="imageToEdit.url" :imgId="imageToEdit.id" :isAvater="true" @outputEdit="outputImageEdit" />
                    </v-card-text>
                </div>
            </v-card>
        </v-dialog>
    </v-card>
</template>

<script>
import { auth, functions, storage } from '@/firebase'
import ImageEditorDialogue from '@/components/ImageEditorDialogue.vue'

export default {
    name: 'SignUpForm',
    components: { ImageEditorDialogue },
    data() {
        return {
            isLoading: false,
            signUpForm: {
                email: '',
                username: '',
                password: '',
                confPassword: '',
                firstName: '',
                surname: '',
                gender: 'Male',
                dob: null,
                height: null,
                weight: null,
                metric: true,
                profilePhotoFile: null,
                country: "United States"
            },

            // CropperJS:
            imageToEdit: {
                id: 0,
                url: null,
                dialogueOpen: false
            },

            // Vuetify:
            showPassword: false,
            birthdayMenu: false,
            rules: {
                required: value => !!value || 'Required.',
                passMatch: value => value == this.signUpForm.password || 'Must match password.',
                min: v => v.length >= 8 || 'Min 8 characters'
            },
            countryList: ["Afghanistan","Albania","Algeria","American Samoa","Andorra","Angola","Anguilla","Antarctica","Antigua and Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas (the)","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia (Plurinational State of)","Bonaire,int Eustatius and Saba","Bosnia and Herzegovina","Botswana","Bouvet Island","Brazil","British Indian Ocean Territory (the)","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Cayman Islands (the)","Central African Republic (the)","Chad","Chile","China","Christmas Island","Cocos (Keeling) Islands (the)","Colombia","Comoros (the)","Congo (the Democratic Republic of the)","Congo (the)","Cook Islands (the)","Costa Rica","Croatia","Cuba","Curaçao","Cyprus","Czechia","Côte d'Ivoire","Denmark","Djibouti","Dominica","Dominican Republic (the)","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Falkland Islands (the) [Malvinas]","Faroe Islands (the)","Fiji","Finland","France","French Guiana","French Polynesia","French Southern Territories (the)","Gabon","Gambia (the)","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guadeloupe","Guam","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti","Heard Island and McDonald Islands","Holy See (the)","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran (Islamic Republic of)","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Korea (the Democratic People's Republic of)","Korea (the Republic of)","Kuwait","Kyrgyzstan","Lao People's Democratic Republic (the)","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macao","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands (the)","Martinique","Mauritania","Mauritius","Mayotte","Mexico","Micronesia (Federated States of)","Moldova (the Republic of)","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands (the)","New Caledonia","New Zealand","Nicaragua","Niger (the)","Nigeria","Niue","Norfolk Island","Northern Mariana Islands (the)","Norway","Oman","Pakistan","Palau","Palestine,tate of","Panama","Papua New Guinea","Paraguay","Peru","Philippines (the)","Pitcairn","Poland","Portugal","Puerto Rico","Qatar","Republic of North Macedonia","Romania","Russian Federation (the)","Rwanda","Réunion","Saint Barthélemy","Saint Helena,scension and Tristan da Cunha","Saint Kitts and Nevis","Saint Lucia","Saint Martin (French part)","Saint Pierre and Miquelon","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Sint Maarten (Dutch part)","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Georgia and the South Sandwich Islands","South Sudan","Spain","Sri Lanka","Sudan (the)","Suriname","Svalbard and Jan Mayen","Sweden","Switzerland","Syrian Arab Republic","Taiwan","Tajikistan","Tanzania,nited Republic of","Thailand","Timor-Leste","Togo","Tokelau","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Turks and Caicos Islands (the)","Tuvalu","Uganda","Ukraine","United Arab Emirates (the)","United Kingdom of Great Britain and Northern Ireland (the)","United States Minor Outlying Islands (the)","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela (Bolivarian Republic of)","Viet Nam","Virgin Islands (British)","Virgin Islands (U.S.)","Wallis and Futuna","Western Sahara","Yemen","Zambia","Zimbabwe","Åland Islands"],
            profilePhotoUrl: null,
            editingImageDialogue: false,
            profilePhotoFile: null
        }
    },

    methods: {
        inputBirthday: function(date) {
            this.$refs.menu.save(date);
        },

        signUp: function() {
            this.isLoading = true;
            let userId, imageRef;

            auth.createUserWithEmailAndPassword(this.signUpForm.email, this.signUpForm.password)
            .then(user => {
                userId = user.user.uid;
                if (this.signUpForm.profilePhotoFile) {
                    imageRef = storage.ref("users/" + user.user.uid + "/pp/" + (Number(new Date())).toString());
                    return imageRef.putString(this.signUpForm.profilePhotoFile, 'data_url');
                } else {
                    this.signUpForm.profilePhoto = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png";
                    console.log("No photo");
                }
            })
            .then(() => {
                if (imageRef) {
                    return imageRef.getDownloadURL().then(url => {
                        this.signUpForm.profilePhoto = url;
                    })
                }
            })
            .then(() => {
                const createUser = functions.httpsCallable("createUser");

                let userPayload = {
                    username: this.signUpForm.username,
                    firstName: this.signUpForm.firstName,
                    surname: this.signUpForm.surname,
                    dob: this.signUpForm.dob,
                    height: this.signUpForm.height,
                    weight: this.signUpForm.weight,
                    country: this.signUpForm.country,
                    metric: this.signUpForm.metric,
                    profilePhoto: this.signUpForm.profilePhoto,
                    gender: this.signUpForm.gender
                }

                return createUser({ userForm: userPayload, userId: userId });
            })
            .then(result => {
                console.log("User created at:" + result.data.userId);
                // As image upload process can take time, we need to sign in again
                // As we have probably been auto signed out due to not having doc data.
                if (!this.$store.state.userProfile.loggedIn) {
                    return auth.signInWithEmailAndPassword(this.signUpForm.email, this.signUpForm.password)
                }
            })
            .then(() => {
                this.isLoading = false;
                this.closeSignUp();
            })
            .catch(e => {
                console.error("Error creating user!", e);
            })


        //     auth.createUserWithEmailAndPassword(this.signUpForm.email, this.signUpForm.password).then(user => {
        //         // User now created in Auth system. We now need to create User in Firestore.
        //         db.collection("users").doc(user.user.uid).set(userPayload).then(() => {
        //                 let imageRef = storage.ref("users/" + user.user.uid + "/pp/" + Number(new Date()));

        //                 imageRef.put(this.signUpForm.profilePhotoFile).then(() => {
        //                 imageRef.getDownloadURL().then(profilePhotoUrl => {
        //                     db.collection("users").doc(user.user.uid).update({ profilePhotoUrl }).then(() => {
        //                         this.isLoading = false;
        //                         this.signUpDialog = false;
        //                     }).catch(e => {
        //                         this.errorMessage = "Error assigning image URL to user." + e;
        //                         console.log(this.errorMessage);
        //                     })
        //                 }).catch(e => {
        //                     this.errorMessage = "Error downloading image URL." + e;
        //                     console.log(this.errorMessage);
        //                 })
        //                 }).catch(e => {
        //                 this.errorMessage = "Error uploading image." + e;
        //                 console.log(this.errorMessage);
        //                 })                
        //             }).catch(e => {
        //                 // TODO: Delete newly created user as not created properly.
        //                 this.errorMessage = "User signed up but error creating user doc." + e;
        //                 console.log(this.errorMessage);
        //                 this.isLoading = false;
        //             })
        //     }).catch(e => {
        //         this.errorMessage = "Error creating user: " + e;
        //         console.log(this.errorMessage);
        //         this.isLoading = false;
        //     })
        // },

        // handleFileUpload: function(e) {
        //     if (e) {
        //         this.profilePhotoUrl = URL.createObjectURL(e);
        //     } else {
        //         this.profilePhotoUrl = '';
        //     }
        },

        handleFileUpload: function(e) {
            this.proilePhotoUrl = URL.createObjectURL(e);
            this.imageToEdit.url  = URL.createObjectURL(e);
            this.imageToEdit.dialogueOpen = true;
            this.editingImageDialogue = true;
        },

        outputImageEdit: function(e) {
            this.imageToEdit.dialogueOpen = false;
            this.profilePhotoUrl = e;
            this.signUpForm.profilePhotoFile = e;
            this.editingImageDialogue = false;
        },

        closeSignUp: function() {
            this.$emit("closeSignUp");
        }
    },
    
    watch: {
        birthdayMenu: function (val) {
            val && setTimeout(() => (this.$refs.picker.activePicker = 'YEAR'))
        }
    }
}
</script>

<style scoped>
    .profilePhoto {
        width: 100%;
        height: auto;
        border-radius: 100%;
    }

    .profilePhoto:hover {
        cursor: pointer;
    }
</style>