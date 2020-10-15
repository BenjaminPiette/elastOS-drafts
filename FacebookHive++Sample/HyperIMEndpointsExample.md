### Token
- Set up token1
This is usually your own token that is created using user_did and app_did but for testing purposes, you can use the following:
```bash
token="eyJhbGciOiAiRVMyNTYiLCAidHlwIjogIkpXVCIsICJ2ZXJzaW9uIjogIjEuMCIsICJraWQiOiAiZGlkOmVsYXN0b3M6aWpVbkQ0S2VScGVCVUZtY0VEQ2JoeE1USlJ6VVlDUUNaTSNwcmltYXJ5In0.eyJpc3MiOiJkaWQ6ZWxhc3RvczppalVuRDRLZVJwZUJVRm1jRURDYmh4TVRKUnpVWUNRQ1pNIiwic3ViIjoiQWNjZXNzVG9rZW4iLCJhdWQiOiJkaWQ6ZWxhc3RvczppZGZwS0pKMXNvRHhUMkdjZ0NSbkR0M2N1OTRabkdmek5YIiwiZXhwIjoxNjA1MjkwMzgxLCJ1c2VyRGlkIjoiZGlkOmVsYXN0b3M6aWo4a3JBVlJKaXRaS0ptY0N1Zm9MSFFqcTdNZWYzWmpUTiIsImFwcElkIjoiYXBwaWQiLCJhcHBJbnN0YW5jZURpZCI6ImRpZDplbGFzdG9zOmlkZnBLSkoxc29EeFQyR2NnQ1JuRHQzY3U5NFpuR2Z6TlgifQ.VNp73XlJ1hgvJSfN8qYy3k4JkFEGE6C-CeYevpJmgWx0AXPD8EPm3SRNd2z59-eOCLD21vhmteVSZ0X1OmZKFw"
```
This sets up did="did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN" and app_did="appid"
- Set up token2
This is a second token that can be used for testing purposes(eg. when one did user tries to access another did user's vault)
```bash
token2="eyJhbGciOiAiRVMyNTYiLCAidHlwIjogIkpXVCIsICJ2ZXJzaW9uIjogIjEuMCIsICJraWQiOiAiZGlkOmVsYXN0b3M6aWpVbkQ0S2VScGVCVUZtY0VEQ2JoeE1USlJ6VVlDUUNaTSNwcmltYXJ5In0.eyJpc3MiOiJkaWQ6ZWxhc3RvczppalVuRDRLZVJwZUJVRm1jRURDYmh4TVRKUnpVWUNRQ1pNIiwic3ViIjoiQWNjZXNzVG9rZW4iLCJhdWQiOiJkaWQ6ZWxhc3RvczppZGZwS0pKMXNvRHhUMkdjZ0NSbkR0M2N1OTRabkdmek5YIiwiZXhwIjoxNjA1MjkwMzgxLCJ1c2VyRGlkIjoiZGlkOmVsYXN0b3M6aW9MRmkyMmZvZG1GVUFGS2lhNnVUVjJXOEp6OXZFY1F5UCIsImFwcElkIjoiYXBwaWQiLCJhcHBJbnN0YW5jZURpZCI6ImRpZDplbGFzdG9zOmlkZnBLSkoxc29EeFQyR2NnQ1JuRHQzY3U5NFpuR2Z6TlgifQ.RjNBt_D6Ax-JQbFU2kXHygdj50TDgoGWOew4oBO-P_N0SPDZbQhkIgESwHBweS5Fzsyx-zQVilp-Yxw6Fy2rqA"
```
This sets up did="did:elastos:ioLFi22fodmFUAFKia6uTV2W8Jz9vEcQyP" and app_did="appid"

### First Time Only
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
          "did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN",
          "did:elastos:ioLFi22fodmFUAFKia6uTV2W8Jz9vEcQyP"
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
      "group_id": {"\$oid": "5f875c6018b1be3c86b2e490"},
      "friend_did": "did:elastos:ijUnD4KeRpeBUFmcEDCbhxMTJRzUYCQCZM"
    }
  }
EOF
```

### Register all the scripts
- Set script "get_group_messages" that gets the last 100 messages for a particular group ID sorted with "created" field in the ascending order
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_group_messages",
      "executable": {
        "type": "find",
        "name": "find_messages",
        "output": true,
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
        "output": true,
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
            "output": true,
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

- Set script "upload_file" that uploads a file to a vault
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "upload_file",
      "executable": {
        "type": "fileUpload",
        "name": "upload",
        "output": true,
        "body": {
          "path": "\$params.path"
        }
      },
      "condition": {
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
    }
EOF
```

- Set script "download_file" that downloads a file from a vault
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "download_file",
      "executable": {
        "type": "fileDownload",
        "name": "download",
        "output": true,
        "body": {
          "path": "\$params.path"
        }
      },
      "condition": {
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
    }
EOF
```

- Set script "get_file_info" that gets the properties and hash of a file
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_file_info",
      "executable": {
        "type": "aggregated",
        "name": "get_file_properties_and_hash",
        "body": [
          {
            "type": "fileProperties",
            "name": "file_properties",
            "output": true,
            "body": {
              "path": "\$params.path"
            }
          }, 
          {
            "type": "fileHash",
            "name": "file_hash",
            "output": true,
            "body": {
              "path": "\$params.path"
            }
          }
        ]
      },
      "condition": {
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
    }
EOF
```

### Run all the scripts
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
      "get_groups": {
        "items": [
          {
            "name": "Tuum Tech"
          }
        ]
      }
    }
```

- Run script "add_group_message"
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "add_group_message",
      "params": {
        "group_id": {"\$oid": "5f875c6018b1be3c86b2e490"},
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
      "get_last_message": {
        "items": [
          {
            "content": "New Message",
            "created": {
              "$date": 1630022400000
            },
            "friend_did": "did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN",
            "group_id": {
              "$oid": "5f875c6018b1be3c86b2e490"
            },
            "modified": {
              "$date": 1602774322173
            }
          }
        ]
      }
    }
```

- Run script "get_group_messages". 
NOTE: This is using $token2 because we're going to test calling a script as user2 that accesses user1's vault. More specifically, $token2 contains caller_did and caller_app_did so we have to pass in context with target_did(the vault owner's DID)
```bash
caller_did="did:elastos:ioLFi22fodmFUAFKia6uTV2W8Jz9vEcQyP" # This is the DID of user2
caller_app_did="appid" # This is the application that's calling the script
target_did="did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN" # This is the DID of user1
target_app_did="appid" # This is the application that's calling the script
```
```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token2" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_group_messages",
      "context": {
        "target_did": "did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN"
      },
      "params": {
        "group_id": {"\$oid": "5f875c6018b1be3c86b2e490"}
      }
    }
EOF
```
Should return something like
```json
    {
      "_status": "OK",
      "find_messages": {
        "items": [
          {
            "content": "Old Message",
            "created": {
              "$date": 1602706609149
            },
            "friend_did": "did:elastos:ijUnD4KeRpeBUFmcEDCbhxMTJRzUYCQCZM",
            "group_id": {
              "$oid": "5f875c6018b1be3c86b2e490"
            },
            "modified": {
              "$date": 1602706609149
            }
          },
          {
            "content": "New Message",
            "created": {
              "$date": 1630022400000
            },
            "friend_did": "did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN",
            "group_id": {
              "$oid": "5f875c6018b1be3c86b2e490"
            },
            "modified": {
              "$date": 1602774322173
            }
          }
        ]
      }
    }
```

- Run script "update_group_message"
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "update_group_message",
      "params": {
        "group_id": {"\$oid": "5f875c6018b1be3c86b2e490"},
        "old_content": "New Message",
        "new_content": "Updated Message"
      }
    }
EOF
```
Should return something like
```json
  {
    "_status": "OK"
  }
```

- Run script "delete_group_message"
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "delete_group_message",
      "params": {
        "group_id": {"\$oid": "5f875c6018b1be3c86b2e490"},
        "content": "Updated Message"
      }
    }
EOF
```
Should return something like
```json
  {
    "_status": "OK"
  }
```

- Run the script to upload
```bash
curl -F data=@me.jpg http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: multipart/form-data" -F "metadata=
    {
      \"name\": \"upload_file\",
      \"params\": {
        \"group_id\": {\"\$oid\": \"5f875c6018b1be3c86b2e490\"},
        \"path\": \"logging.conf\"
      }
    }"
```
Should return something like:
```json
    {
      "_status": "OK",
      "upload_file": {
        "path": "logging.conf",
        "upload": "Successful",
        "vault_endpoint": "/api/v1/files/download?path=logging.conf"
      }
    }
```

- Run the script to download
NOTE: You should first upload a file using upload file API or scripting file API before you're able to download
 ```bash
curl --output downloaded-logging.conf -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "download_file",
      "params": {
        "group_id": {"\$oid": "5f875c6018b1be3c86b2e490"},
        "path": "logging.conf"
      }
    }
EOF
```
Should just download the file and save it to downloaded-run.sh file.

- Get both the properties and hash of a file
```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_file_info",
      "params": {
        "group_id": {"\$oid": "5f875c6018b1be3c86b2e490"},
        "path": "run.sh"
      }
    }
EOF
```
Should return something like:
```json
    {
      "_status": "OK",
      "file_hash": {
        "SHA256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      },
      "file_properties": {
        "last_modify": 1602774453.520667,
        "name": "run.sh",
        "size": 0,
        "type": "file"
      }
    }
```
