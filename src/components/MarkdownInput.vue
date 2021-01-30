<template>
    <v-card class="markdownInput" outlined>
            <v-tabs
                v-model="tab"
                icons-and-text
                fixed-tabs
            >
                <v-tabs-slider></v-tabs-slider>
                <v-tab href="#tab-1">
                    <v-icon>mdi-pencil</v-icon>
                </v-tab>

                <v-tab href="#tab-2">
                    <v-icon>mdi-eye-outline</v-icon>
                </v-tab>

                <v-tab href="#tab-3">
                    <v-icon>mdi-information-outline</v-icon>
                </v-tab>
            </v-tabs>
        <v-tabs-items v-model="tab">
            <v-tab-item :value="'tab-1'">
                <v-container>
                    <v-textarea 
                        placeholder="Enter text here. View formatted text on the eyeball tab. For more information on formatting, press the information tab. TIP: New paragraphs require 2 'enters'." 
                        ref="textArea"
                        full-width 
                        auto-grow 
                        @keyup="handleType"
                        @mouseup="setCaretPos"
                        @input="emitInput"
                        v-model="inputDescription" 
                        height="396"
                        counter 
                        no-resize
                        class="inputTextArea"
                        :rules=[rules.required,rules.max]
                    ></v-textarea>
                    <v-btn icon @click="formatUl"><v-icon title="Bulleted List">mdi-format-list-bulleted</v-icon></v-btn>
                    <v-btn icon @click="formatOl"><v-icon title="Numbered List">mdi-format-list-numbered</v-icon></v-btn>
                    <v-btn icon @click="formatBold"><v-icon title="Bold">mdi-format-bold</v-icon></v-btn>
                    <v-btn icon @click="formatItalic"><v-icon title="Emphasis">mdi-format-italic</v-icon></v-btn>
                    <v-btn icon @click="formatHeading"><v-icon title="Heading">mdi-format-header-1</v-icon></v-btn>
                    <v-btn icon @click="formatSubHeading"><v-icon title="Subheading">mdi-format-header-2</v-icon></v-btn>
                    <v-btn icon @click="formatImage"><v-icon title="Add Image">mdi-image-outline</v-icon></v-btn>
                    <v-btn icon @click="formatUrl"><v-icon title="Add URL">mdi-link</v-icon></v-btn>

                </v-container>
            </v-tab-item>

            <v-tab-item :value="'tab-2'">
                <v-container>
                    <v-card class="mdOutput" v-html="compiledMarkdown"></v-card>
                </v-container>
            </v-tab-item>

            <v-tab-item :value="'tab-3'">
                <v-container>
                    <v-card>For more information on formatting, please see <a href="https://www.markdownguide.org/basic-syntax/" target="_blank">here</a>.</v-card>
                </v-container>
            </v-tab-item>
        </v-tabs-items>
    </v-card>
</template>

<script>
import * as marked from 'marked'
import _ from 'lodash'

export default {
    name: 'MarkdownInput',
    props: {
        startingText: {
            type: String,
            required: false
        }
    },
    data() {
        return {
            inputDescription: '',
            inputByRow: [""],
            
            // Markdown Format:
            caretPos: 0,
            caretRow: 0,
            olRow: false,
            ulRow: false,


            //Vuetify: 
            tab: null,
            rules: {
                required: value => !!value || 'Required.',
                max: value => value.length <= 5096 || 'Max 5096 characters.'
            }
        }
    },

    mounted: function() {
        if (this.$props.startingText) {
            this.inputDescription = this.$props.startingText
        }
    },

    computed: {
        compiledMarkdown: function() {
            return marked(this.inputDescription);
        }
    },

    methods: {
        handleType: function(e) {
            // Check amount of lines in input then set up our inputByRow array.
            if (this.inputDescription.includes("\n")) {
                this.inputByRow = this.inputDescription.split("\n");
            } else {
                this.inputByRow = [this.inputDescription];
            }

            // Get our cursor position.
            this.setCaretPos(e);

            // See if we are in a row with any lists.
            if (this.inputByRow[this.caretRow].trimStart().substring(0, 2) == "* " || this.inputByRow[this.caretRow].trimStart().substring(0, 2) == "- " || this.inputByRow[this.caretRow].trimStart().substring(0, 2) == "+ ") {
                this.ulRow = true;
                this.olRow = false;
            } else if (this.inputByRow[this.caretRow].trimStart().substring(0, 2) == "* " || this.inputByRow[this.caretRow].trimStart().substring(0, 2) == "- " || this.inputByRow[this.caretRow].trimStart().substring(0, 2) == "+ ") {
                this.olRow = true;
                this.ulRow = false;
            }

            // Also see if above row is any lists (for if we have just released enter button)
            let aboveUlRow = false;
            let aboveOlRow = false;
            if (this.caretRow > 0) {
                if (this.inputByRow[this.caretRow - 1].trimStart().substring(0, 2) == "* " || this.inputByRow[this.caretRow - 1].trimStart().substring(0, 2) == "- " || this.inputByRow[this.caretRow - 1].trimStart().substring(0, 2) == "+ ") {
                    aboveUlRow = true;
                } else if (this.inputByRow[this.caretRow - 1].trimStart().substring(0, 3) == "1. ") {
                    aboveOlRow = true;
                }
            }

            // Checks with lists and enter.
            if (this.caretRow > 0) {
                console.log(e.keycode, aboveOlRow);
                // If Enter, Above list (as we've just pressed enter) and Above row length is 2, then above ul was empty, so ditch it.
                // Also check for if the new row has content, as if the user has pressed enter there they probably are intending for * to stay.
                if (e.keyCode === 13 && aboveUlRow && this.inputByRow[this.caretRow - 1].length === 2 && this.inputByRow[this.caretRow].length === 0) {
                    console.log("End ul list.")
                    this.inputDescription = this.inputDescription.substring(0, this.caretPos - 3) + this.inputDescription.substring(this.caretPos, this.inputDescription.length);
                    this.caretPos -= 3;
                    this.ulRow = false;
                    this.setSelectionArea();
                }
                // If Enter, and Ulrow, place another ul tag.
                else if (e.keyCode === 13 && aboveUlRow) {
                    console.log("New ul list tag.")
                    this.inputByRow[this.caretRow] = "* " + this.inputByRow[this.caretRow];
                    this.caretPos += 2;
                    this.ulRow = true;
                    this.inputDescription = this.inputByRow.join("\n");
                    this.setSelectionArea();
                }
                // Same as 2 above but for ol.
                else if (e.keyCode === 13 && aboveOlRow && this.inputByRow[this.caretRow - 1].length == 3 && this.inputByRow[this.caretRow].length === 0) {
                    console.log("End ol list");
                    this.inputDescription = this.inputDescription.substring(0, this.caretPos - 4) + this.inputDescription.substring(this.caretPos, this.inputDescription.length);
                    this.caretPos -= 4;
                    this.olRow = false;
                    this.setSelectionArea();
                }
                // " "
                else if (e.keyCode === 13 && aboveOlRow) {
                    console.log("New ol list tag.")
                    this.inputByRow[this.caretRow] = "1. " + this.inputByRow[this.caretRow];
                    this.caretPos += 3;
                    this.olRow = true;
                    this.inputDescription = this.inputByRow.join("\n");
                    this.setSelectionArea();
                }
            }
        },

        setCaretPos: function(e) {
            this.caretPos = e.target.selectionStart;
            if (this.inputByRow.length > 1) {
                this.caretRow = this.getCaretRow(this.inputByRow);
            } else {
                this.caretRow = 0;
            }            
        },

        getCaretRow: function(arr) {
            let count = 0;
            let i = 0;
            let rowFound = null;

            arr.forEach(a => {
                count += a.length;
                if (count >= this.caretPos && rowFound == null) {
                    rowFound = i;
                }
                i++;
                count++;
            })
            if (rowFound != null) { return rowFound } else { console.log("Failure finding row"); return false; }
        },

        // Unordered list button click.
        formatUl: function() {
            if (this.ulRow) {
                this.inputByRow[this.caretRow] = this.inputByRow[this.caretRow].substring(2);
                this.ulRow = false;
                this.caretPos -= 2;
            } else {
                this.inputByRow[this.caretRow] = "* " + this.inputByRow[this.caretRow];
                this.ulRow = true;
                this.caretPos += 2;
            }

            this.inputDescription = this.inputByRow.join("\n");
            this.$refs.textArea.focus();
            this.setSelectionArea();            

        },

        // Ordered list button click.
        formatOl: function() {
            if (this.olRow) {
                this.inputByRow[this.caretRow] = this.inputByRow[this.caretRow].substring(3);
                this.olRow = false;
                this.caretPos -= 3;
            } else {
                this.inputByRow[this.caretRow] = "1. " + this.inputByRow[this.caretRow];
                this.olRow = true;
                this.caretPos += 3;
            }

            this.inputDescription = this.inputByRow.join("\n");
            this.$refs.textArea.focus();
            this.setSelectionArea(); 
        },

        // Bold
        formatBold: function() {
            this.inputDescription = this.inputDescription.substring(0, this.caretPos) + "****" + this.inputDescription.substring(this.caretPos, this.inputDescription.length);
            this.caretPos += 2;
            this.$refs.textArea.focus();
            this.setSelectionArea();
        },

        // Italics
        formatItalic: function() {
            this.inputDescription = this.inputDescription.substring(0, this.caretPos) + "**" + this.inputDescription.substring(this.caretPos, this.inputDescription.length);
            this.caretPos += 1;
            this.$refs.textArea.focus();
            this.setSelectionArea();
        },

        // Header
        formatHeading: function() {
            // First check if there are more than 2 hashtags at the start (if so, then don't do anything with this.)
            if (this.inputByRow[this.caretRow].substring(0, 3) !== "###") {
                // Check if subheading, if so just knock off 1 character.
                if (this.inputByRow[this.caretRow].substring(0, 3) === "## ") {
                    this.inputByRow[this.caretRow] = this.inputByRow[this.caretRow].substring(1, this.inputByRow[this.caretRow].length);
                    this.caretPos --;
                }
                else if (this.inputByRow[this.caretRow].substring(0, 2) === "# ") {
                    this.inputByRow[this.caretRow] = this.inputByRow[this.caretRow].substring(2, this.inputByRow[this.caretRow].length);
                    this.caretPos -= 2;
                } else {
                    this.inputByRow[this.caretRow] = "# " + this.inputByRow[this.caretRow];
                    this.caretPos += 2;
                }  

                this.inputDescription = this.inputByRow.join("\n");
            }
            
            this.$refs.textArea.focus();
            this.setSelectionArea();
        },

        // Subheader
        formatSubHeading: function() {
            // First check if there are more than 2 hashtags at the start (if so, then don't do anything with this.)
            if (this.inputByRow[this.caretRow].substring(0, 3) !== "###") {
                // Check if subheading, if so remove.
                if (this.inputByRow[this.caretRow].substring(0, 3) === "## ") {
                    this.inputByRow[this.caretRow] = this.inputByRow[this.caretRow].substring(3, this.inputByRow[this.caretRow].length);
                    this.caretPos -= 3;
                }
                else if (this.inputByRow[this.caretRow].substring(0, 2) === "# ") {
                    this.inputByRow[this.caretRow] = "#" + this.inputByRow[this.caretRow];
                    this.caretPos ++;
                } else {
                    this.inputByRow[this.caretRow] = "## " + this.inputByRow[this.caretRow];
                    this.caretPos += 3;
                }  

                this.inputDescription = this.inputByRow.join("\n");
            }
            
            this.$refs.textArea.focus();
            this.setSelectionArea();
        },

        // Image
        formatImage: function() {
            this.inputDescription = this.inputDescription.substring(0, this.caretPos) + "![image_name_here](image_URL_here.jpg)" + this.inputDescription.substring(this.caretPos, this.inputDescription.length);
            this.caretPos += 19;

            this.$refs.textArea.focus();
            this.setSelectionArea(this.caretPos, this.caretPos + 18);
        },

        // URL
        formatUrl: function() {
            this.inputDescription = this.inputDescription.substring(0, this.caretPos) + "[text_to_show_here](url_to_go_to_here)" + this.inputDescription.substring(this.caretPos, this.inputDescription.length);
            this.caretPos += 20;
            this.$refs.textArea.focus();
            this.setSelectionArea(this.caretPos, this.caretPos + 17);
        },

        // Sets selection to this.caretPos
        // Vue must setTimeout when setting selection range for reasons.
        setSelectionArea: _.debounce(function(start = this.caretPos, end = this.caretPos) {
            this.$refs.textArea.$el.querySelector('textarea').setSelectionRange(start, end);
        }, 2),

        emitInput: _.debounce(function() {
            this.$emit("update-text",this.inputDescription);
        }, 300)
    },

    watch: {}
}
</script>

<style scoped>
    .markdownInput {
        margin-top: 10px;
    }

    .descText {
        padding: 10px;
    }

    .mdOutput {
        box-shadow: unset !important;
    }

    .inputTextArea {
        max-height: 1024px;
        overflow-y: auto;
    }
</style>