# scenario

`scenario` is a framework for describing CloudFunctions based on data relationships.

We designed the following for large scale development in CloudFunctions.
First, we separated CloudFirestore's data by domain based on the SRP (Single Responsibility Principle).

For example.
We used `social` for the treatment of social features, and separated it with `message` for the treatment of message features.

```
social/v1/users/:uid
```

```
message/v1/users/:uid
```

This design works very well with the scalability of the specification. 
We prohibited client-side cross-domain processing and left it to CloudFunctions to handle. This is because coding across domains can complicate management and make maintenance difficult for clients.

Processing using the API is coded procedurally. Programs that run sequentially are easy to understand, even if there is processing across multiple domains.
Even today, APIs using Callable Functions are easier to understand if you write them that way.
However, in order to take advantage of the features of Firestore SDK, it is not a good idea to make extensive use of Callable Functions. This is because we can't support offline and we can't use WriteBatch.
It's important to use the Firestore Trigger efficiently in order to develop with the advantages of Firestore.

We decided to use Cloud Functions, specifically the Firestore Trigger, to do the inter-domain processing. But it also created a new problem. Firestore Trigger was difficult to describe the order in which it would be executed and the relationships between the data, making it significantly less maintainable.

__Scenario__ allows for redundancy in Cloud Functions and focuses on the flow of data across domains.

![scenario](https://github.com/1amageek/scenario/blob/master/docs/concept.png)

![scenario](https://github.com/1amageek/scenario/blob/master/docs/image0.png)

![scenario](https://github.com/1amageek/scenario/blob/master/docs/image1.png)

![scenario](https://github.com/1amageek/scenario/blob/master/docs/image2.png)

## Usage

```typescript
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
```

### with Dependency

Scenario allows you to limit the sphere of influence within which side effects occur in a field. If there are no changes in the fields defined in the Dependency List, no side effects will occur.

In the following example, the same DocumentReference is defined, but the side effects depend on changes to `createdAt` and `updatedAt`. In addition, CloudFunctions is defined as two Functions.

```typescript
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
```
