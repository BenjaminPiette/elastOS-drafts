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

- Create a new message "Old Message"
```bash
curl -XPOST http://localhost:5000/api/v1/db/insert_one -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
  {
    "collection": "messages",
    "document": {
      "content": "Old Message",
      "group_id": "5f484a24efc1cbf6fc88ffb7",
      "friend_did": "did:elastos:ijUnD4KeRpeBUFmcEDCbhxMTJRzUYCQCZM"
    }
  }
EOF
```

- Create a new subcondition "user_in_group"
```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_subcondition -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "user_in_group",
      "condition": {
        "endpoint": "condition/has_results",
        "collection": "groups",
        "options": {
          "filter": {
            "group_id": "_id", 
            "*caller_did": "friends"
          },
          "skip": 0,
          "limit": 10,
          "maxTimeMS": 1000000000
        }
      }
    }
EOF
```

- Set script "get_group_messages" that gets the last 100 messages for a particular group ID sorted with "created" field in the ascending order
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_group_messages",
      "exec_sequence": [
        {
          "endpoint": "db/find_many",
          "collection": "messages",
          "options": {
            "filter": {
              "group_id": "group_id"
            },
            "projection": {"_id": false},
            "limit": 100
          }
        }
      ],
      "condition": {
          "operation": "sub",
          "name": "user_in_group"
      }
    }
EOF
```  

- Set script "get_groups" that gets all the groups the DID user belongs to. As part of the result, only the "_id" and "name" are returned
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_groups",
      "exec_sequence": [
        {
          "endpoint": "db/find_many",
          "collection": "groups",
          "options": {
            "filter": {
              "*caller_did": "friends"
            },
            "projection": {
              "_id": false,
              "name": true
            }
          }
        }
      ]
    }
EOF
```

- Set script "add_group_message" that adds a message to the group messaging. As part of the result, only the recently added content with the fields "created" and "content" are returned
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "add_group_message",
      "exec_sequence": [
        {
          "endpoint": "db/insert_one",
          "collection": "messages",
          "document": {
            "group_id": "group_id",
            "*caller_did": "friend_did",
            "content": "content",
            "content_created": "created"
          },
          "options": {"bypass_document_validation":false}
        },
        {
          "endpoint": "db/find_one",
          "collection": "messages",
          "options": {
            "filter": {
              "group_id": "group_id"
            },
            "projection": {"_id": false},
            "sort": {"created": "desc"},
            "allow_partial_results": false,
            "return_key": false,
            "show_record_id": false,
            "batch_size": 0
          }
        }
      ],
      "condition": {
        "operation": "and",
        "conditions": [
            {
                "operation": "sub",
                "name": "user_in_group"
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
        "group_id": "5f484a24efc1cbf6fc88ffb7",
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
        "group_id": "5f484a24efc1cbf6fc88ffb7"
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