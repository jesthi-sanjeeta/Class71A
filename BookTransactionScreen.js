import React from 'react';
import {Text, View,TouchableOpacity,StyleSheet,TextInput,Image, Alert} from 'react-native';
//import { TouchableOpacity } from 'react-native-gesture-handler';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import * as firebase from 'firebase';
import db from '../config.js';
export default class BookTransactionScreen extends React.Component{
    constructor(){
        super();
        this.state={
            hasCameraPermissions:null,
            scanned:false,
            scannedBookId:'',
            scannedStudentId:'',
            buttonState:'normal'
        }
    }
    getCameraPermission =async(id)=>{
        const {status} = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({
            hasCameraPermissions:status=== "granted",
            buttonState:id,
            scanned:false
        })
    }
    handleBarCodeScanned=async({type,data})=>{
        const {buttonState} = this.state
        if(buttonState==="BookId"){
            this.setState({
                scanned:true,
                scannedBookId:data,
                buttonState:'normal'
            })
        }
        else if(buttonState==="StudentId"){
            this.setState({
                scanned:true,
                scannedStudentId:data,
                buttonState:'normal'
            })
        }
    }
    handleTransaction=async()=>{
        var transactionMessage
        db.collection("books").doc(this.state.scannedBookId).get()
        .then((doc)=>{
            console.log(doc.data())
            var book=doc.data();
            if(book.bookAvailability){
                this.initiateBookIssue();
                transactionMessage='Book Issued'
            }
            else{
                this.initiateBookReturn();
                transactionMessage="Book Returned"
            }
        })
        this.setState({
            transactionMessage:transactionMessage
        })
    }
    initiateBookIssue=async()=>{
        db.collection("transcation").add({
            'studentId':this.state.scannedStudentId,
            'bookId':this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'tranactionType':"Issue"
        })
        db.collection("books").doc(this.state.scannedBookId).update({
            bookAvailability:false
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(1)
        })
        Alert.alert('Book Issued');
        this.setState({
            scannedBookId:'',
            scannedStudentId:''
        })

    }
    initiateBookReturn=async()=>{
        db.collection("transcation").add({
            'studentId':this.state.scannedStudentId,
            'bookId':this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'tranactionType':"Return"
        })
        db.collection("books").doc(this.state.scannedBookId).update({
            bookAvailability:true
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(-1)
        })
        Alert.alert('Book Returned');
        this.setState({
            scannedBookId:'',
            scannedStudentId:''
        })

    }
    render(){
        const hasCameraPermissions = this.state.hasCameraPermissions;
        const scanned = this.state.scanned;
        const buttonState= this.state.buttonState;
        if(buttonState!=='normal' && hasCameraPermissions){
            return(
                <BarCodeScanner
                    onBarCodeScanned={scanned?undefined:this.handleBarCodeScanned}
                style = {StyleSheet.absoluteFillObject}
            />)
        }
        else if(buttonState === 'normal'){
            return(
                
                <View style={styles.container}>
                    <View>
                        <Image
                        source={require("../assets/book.png")}
                        style ={{width:200,height:200}}/>
                        <Text style={{textAlign:'center',fontSize:30}}>
                            Wily</Text>
                    </View>
                    <View style={styles.inputView}>
                        <TextInput
                        style={styles.inputBox}
                        placeholder="Book id"
                        value={this.state.scannedBookId}/>
                        <TouchableOpacity style={styles.scanButton}
                        onPress={()=>{this.getCameraPermission('BookId')}}>
                            <Text style={styles.buttonText}>Scan</Text>

                        </TouchableOpacity>
                    </View>
                    <View style={styles.inputView}>
                        <TextInput
                        style={styles.inputBox}
                        placeholder="Student id"
                        value={this.state.scannedStudentId}/>
                        <TouchableOpacity style={styles.scanButton}
                        onPress={()=>{this.getCameraPermission('StudentId')}}>
                            <Text style={styles.buttonText}>Scan</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitButton}
                        onPress={async()=>{this.handleTransaction()}}>
                            <Text style={styles.submitButtonText}>SUBMIT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )
        }
    }
}
const styles = StyleSheet.create({
    container:{
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    },
    textDisplay:{
        fontSize:15,
        textDecorationLine:'underline'
    },
    buttonText:{
        fontSize:15,
        textAlign:'center',
        marginTop:10,
        
    },
    scanButton:{
        backgroundColor:'#66BB6A',
        width:50,
        height:40,
        borderWidth:1.5,
        borderLeftWidth:0,
        
        marginTop:0
    },
    inputView:{
        flexDirection:'row',
        margin:20
    },
    inputBox:{
        width:200,
        height:40,
        fontSize:20,
        padding:10,
        borderWidth:1.5,
        borderRightWidth:0,
        
    },
    submitButton:{
        backgroundColor:'#FBC02D',
        width:100,
        height:50,
        
        marginTop:80
        
    },
    submitButtonText:{
        padding:10,
        textAlign:'center',
        fontSize:20,
        fontWeight:'bold',
        color:'white'
    }
})