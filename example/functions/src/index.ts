import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Builder from 'scenario'

export const sendPushNotification = Builder(functions.region('us-central1'), context => {

    context.handler('/socail/{version}/users/{uid}/feeds/{feedId}/actions/{actionId}', document => {
        document.onCreate(async (snapshot, _) => {
            const from: string = snapshot.data()!.from
            const to: string = snapshot.data()!.to
            const id: string = [from, to].sort().join('')
            await admin.firestore().collection(`/message/v1/rooms/${id}/transcripts`).doc().set({
                'message': 'You have new message.'
            })
        })
    })

    context.handler('/message/{version}/rooms/{roomId}/transcripts/{transcriptId}', document => {
        document.onCreate((snapshot, _) => {
            // Send PushNotification
        })
    })
})

export const productChangeLog = Builder(functions.region('us-central1'), context => {

    context.handler('/commerce/{version}/product/{productId}', document => {
        document.onWrite(async (snapshot, ctx) => {
            await snapshot.after.ref.collection('logs').doc().set({
                editorId: ctx.auth!.uid,
                type: 'create'
            })
        }, ['createdAt'])
    })

    context.handler('/commerce/{version}/product/{productId}', document => {
        document.onWrite(async (snapshot, ctx) => {
            await snapshot.after.ref.collection('logs').doc().set({
                editorId: ctx.auth!.uid,
                type: 'update'                
            })
        }, ['updatedAt'])
    })

    context.handler('/commerce/{version}/product/{productId}/logs/{logId}', document => {
        document.onCreate((snapshot, _) => {
            // Send Message
        })
    })
})