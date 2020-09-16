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
          "did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN"
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
      "group_id": {"\$oid": "5f615e97e3dff8d05a1a53d8"},
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
            "group_id": "\$params.group_id"
          },
          "options": {
            "projection": {
              "_id": false
            }
          }
        }
      },
      "condition": {
        "type": "queryHasResults",
        "name": "verify_user_permission",
        "body": {
          "collection": "groups",
          "filter": {
            "_id": "\$params.group_id",
            "friends": "\$caller_did"
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
            "friends": "\$caller_did"
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
                "group_id": "\$params.group_id",
                "friend_did": "\$caller_did",
                "content": "\$params.content",
                "created": "\$params.content_created"
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
                "group_id": "\$params.group_id"
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
            "type": "queryHasResults",
            "name": "user_in_group",
            "body": {
              "collection": "groups",
              "filter": {
                "_id": "\$params.group_id",
                "friends": "\$caller_did"
              }
            }
          },
          {
            "type": "queryHasResults",
            "name": "user_in_group",
            "body": {
              "collection": "groups",
              "filter": {
                "_id": "\$params.group_id",
                 "friends": "\$caller_did"
              }
            }
          }
        ]
      }
    }
EOF
```

- Set script "update_group_message" that updates one message with the given filter from the group messaging. Note the key $set being surrounded by single quote. This is required if you're passing in any operations of executables that start with "$"
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "update_group_message",
      "executable": {
        "type": "update",
        "name": "update_and_return",
        "body": {
          "collection": "messages",
          "filter": {
            "group_id": "\$params.group_id",
            "friend_did": "\$caller_did",
            "content": "\$params.old_content"
          },
          "update": {
            "\$set": {
              "group_id": "\$params.group_id",
              "friend_did": "\$caller_did",
              "content": "\$params.new_content"
            }
          },
          "options": {
            "upsert": true,
            "bypass_document_validation": false
          }
        }
      },
      "condition": {
        "type": "queryHasResults",
        "name": "verify_user_permission",
        "body": {
          "collection": "groups",
          "filter": {
            "_id": "\$params.group_id",
            "friends": "\$caller_did"
          }
        }
      }
    }
EOF
```

- Set script "delete_group_message" that deletes one message with the given filter from the group messaging. 
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "delete_group_message",
      "executable": {
        "type": "delete",
        "name": "delete_and_return",
        "body": {
          "collection": "messages",
          "filter": {
            "group_id": "\$params.group_id",
            "friend_did": "\$caller_did",
            "content": "\$params.content"
          }
        }
      },
      "condition": {
        "type": "queryHasResults",
        "name": "verify_user_permission",
        "body": {
          "collection": "groups",
          "filter": {
            "_id": "\$params.group_id",
            "friends": "\$caller_did"
          }
        }
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
          "name": "Tuum Tech"
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
        "group_id": {"\$oid": "5f615e97e3dff8d05a1a53d8"},
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
      "items": [
        {
          "content": "New Message",
          "created": {
            "$date": 1630022400000
          },
          "friend_did": "did:elastos:ijUnD4KeRpeBUFmcEDCbhxMTJRzUYCQCZM",
          "group_id": {
            "$oid": "5f615e97e3dff8d05a1a53d8"
          },
          "modified": {
            "$date": 1598803861786
          }
        }
      ]
    }
```

- Run script "get_group_messages"
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_group_messages",
      "params": {
        "group_id": {"\$oid": "5f615e97e3dff8d05a1a53d8"}
      }
    }
EOF
```
Should return something like
```json
    {
      "_status": "OK",
      "items": [
        {
          "content": "Old Message",
          "created": {
            "$date": 1598802809056
          },
          "friend_did": "did:elastos:ijUnD4KeRpeBUFmcEDCbhxMTJRzUYCQCZM",
          "group_id": {
            "$oid": "5f615e97e3dff8d05a1a53d8"
          },
          "modified": {
            "$date": 1598802809056
          }
        },
        {
          "content": "New Message",
          "created": {
            "$date": 1630022400000
          },
          "friend_did": "did:elastos:ijUnD4KeRpeBUFmcEDCbhxMTJRzUYCQCZM",
          "group_id": {
            "$oid": "5f615e97e3dff8d05a1a53d8"
          },
          "modified": {
            "$date": 1598803861786
          }
        }
      ]
    }
```

- Run script "update_group_message"
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "update_group_message",
      "params": {
        "group_id": {"\$oid": "5f615e97e3dff8d05a1a53d8"},
        "old_content": "New Message",
        "new_content": "Updated Message"
      }
    }
EOF
```
Should return something like
```json
  {
    "_status": "OK",
    "acknowledged": true,
    "matched_count": 1,
    "modified_count": 1,
    "upserted_id": "None"
  }
```

- Run script "delete_group_message"
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "delete_group_message",
      "params": {
        "group_id": {"\$oid": "5f615e97e3dff8d05a1a53d8"},
        "content": "Updated Message"
      }
    }
EOF
```
Should return something like
```json
  {
    "_status": "OK",
    "acknowledged": true,
    "deleted_count":1
  }
```