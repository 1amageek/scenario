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

We decided to use Cloud Functions, specifically the Firestore Trigger, to do the inter-domain processing. But it also created a new problem. Firestore Trigger was difficult to describe the order in which it would be executed and the relationships between the data, making it significantly less maintainable.

## Usage
