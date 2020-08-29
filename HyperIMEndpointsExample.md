- Create a new collection "groups"
```bash
curl -XPOST http://localhost:5000/api/v1/db/create_collection -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "collection": "groups"
    }
EOF
```

- Create a new group "tuum-tech"
```bash
curl -XPOST http://localhost:5000/api/v1/db/insert_many -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
  {
    "collection": "groups",
    "document": [
      {
        "name": "Tuum Tech",
        "friends": [
          "did:elastos:ijUnD4KeRpeBUFmcEDCbhxMTJRzUYCQCZM"
        ]
      },
      {
        "name": "Trinity",
        "friends": [
          "did:elastos:kjKnD4KeRpeBUFmcEDCbhxMTJRzUYCQCZz"
        ]
      }
    ]
  }
EOF
```

- Create a new collection "messages"
```bash
curl -XPOST http://localhost:5000/api/v1/db/create_collection -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "collection": "messages"
    }
EOF
```

- Create a new message "Old Message". Make sure to replace the group_id with the actual id that you get while creating your own collection
```bash
curl -XPOST http://localhost:5000/api/v1/db/insert_one -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
  {
    "collection": "messages",
    "document": {
      "content": "Old Message",
      "group_id": {"\$oid": "5f4ab397029d14bd81ab60bd"},
      "friend_did": "did:elastos:ijUnD4KeRpeBUFmcEDCbhxMTJRzUYCQCZM"
    }
  }
EOF
```

- Set script "get_group_messages" that gets the last 100 messages for a particular group ID sorted with "created" field in the ascending order
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_group_messages",
      "executable": {
        "type": "find",
        "name": "find_messages",
        "body": {
          "collection": "messages",
          "filter": {
            "group_id": "group_id"
          },
          "options": {
            "projection": {
              "_id": false
            },
            "limit": 1
          }
        }
      },
      "condition": {
        "type": "queryHasResult",
        "name": "verify_user_permission",
        "body": {
          "collection": "groups",
          "filter": {
            "group_id": "_id",
            "*caller_did": "friends"
          }
        }
      }
    }
EOF
```  

- Set script "get_groups" that gets all the groups the DID user belongs to. As part of the result, only the "_id" and "name" are returned
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_groups",
      "executable": {
        "type": "find",
        "name": "get_groups",
        "body": {
          "collection": "groups",
          "filter": {
            "*caller_did": "friends"
          },
          "options": {
            "projection": {
              "_id": false,
              "name": true
            }
          }
        }
      }
    }
EOF
```

- Set script "add_group_message" that adds a message to the group messaging. As part of the result, only the recently added content with the fields "created" and "content" are returned
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "add_group_message",
      "executable": {
        "type": "aggregated",
        "name": "add_and_return_message",
        "body": [
          {
            "type": "insert",
            "name": "add_message_to_end",
            "body": {
              "collection": "messages",
              "document": {
                "group_id": "group_id",
                "*caller_did": "friend_did",
                "content": "content",
                "content_created": "created"
              },
              "options": {"bypass_document_validation": false}
            }
          },
          {
            "type": "find",
            "name": "get_last_message",
            "body": {
              "collection": "messages",
              "filter": {
                "group_id": "group_id"
              },
              "options": {
                "projection": {"_id": false},
                "sort": {"created": "desc"},
                "limit": 1
              }
            }
          }
        ]
      },
      "condition": {
        "type": "and",
        "name": "verify_user_permission",
        "body": [
          {
            "type": "queryHasResult",
            "name": "user_in_group",
            "body": {
              "collection": "groups",
              "filter": {
                "group_id": "_id",
                "*caller_did": "friends"
              }
            }
          },
          {
            "type": "queryHasResult",
            "name": "user_in_group",
            "body": {
              "collection": "groups",
              "filter": {
                "group_id": "_id",
                 "*caller_did": "friends"
              }
            }
          }
        ]
      }
    }
EOF
```

- Run script "get_groups"
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_groups"
    }
EOF
```
Should return something like
```json
        {
          "_status": "OK", 
          "items": [
            {
              "name": "Group 1"
            },
            {
              "name": "Group 2"
            }
          ]
        }
```

- Run script "add_group_message"
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "add_group_message",
      "params": {
        "group_id": {"\$oid": "5f4ab397029d14bd81ab60bd"},
        "group_created": {
          "$gte": "2021-08-27 00:00:00"
        },
        "content": "New Message",
        "content_created": "2021-08-27 00:00:00"
      }
    }
EOF
```
Should return something like
```json
        {
          "_status": "OK", 
          "created": "Wed, 25 Feb 1987 17:00:00 GMT",
          "content": "New message"
        }
```

- Run script "get_group_messages"
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_group_messages",
      "params": {
        "group_id": {"\$oid": "5f4ab397029d14bd81ab60bd"}
      }
    }
EOF
```
Should return something like
```json
        {
          "_status": "OK", 
          "_items": [
            {
              "created": "Wed, 25 Feb 1987 17:00:00 GMT",
              "content": "Old Message 1"
            },
            {
              "created": "Wed, 25 Feb 1987 17:00:00 GMT",
              "content": "Old Message 2"
            },
            {
              "created": "Wed, 25 Feb 1987 17:00:00 GMT",
              "content": "New message"
            }
          ]
        }
```