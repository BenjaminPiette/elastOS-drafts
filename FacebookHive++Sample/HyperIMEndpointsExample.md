### Token

- Set up token1
  This is usually your own token that is created using user_did and app_did but for testing purposes, you can use the following:

```bash
token="eyJhbGciOiAiRVMyNTYiLCAidHlwIjogIkpXVCIsICJ2ZXJzaW9uIjogIjEuMCIsICJraWQiOiAiZGlkOmVsYXN0b3M6aWpVbkQ0S2VScGVCVUZtY0VEQ2JoeE1USlJ6VVlDUUNaTSNwcmltYXJ5In0.eyJpc3MiOiJkaWQ6ZWxhc3RvczppalVuRDRLZVJwZUJVRm1jRURDYmh4TVRKUnpVWUNRQ1pNIiwic3ViIjoiQWNjZXNzVG9rZW4iLCJhdWQiOiJkaWQ6ZWxhc3RvczppZGZwS0pKMXNvRHhUMkdjZ0NSbkR0M2N1OTRabkdmek5YIiwiZXhwIjoyNzUyNzM5NzIwNSwicHJvcHMiOiJ7XCJhcHBEaWRcIjogXCJhcHBpZFwiLCBcInVzZXJEaWRcIjogXCJkaWQ6ZWxhc3RvczppajhrckFWUkppdFpLSm1jQ3Vmb0xIUWpxN01lZjNaalROXCIsIFwibm9uY2VcIjogXCI1NDRiZTNjNi0zOTAzLTExZWItYWY0OC1hY2RlNDgwMDExMjJcIn0ifQ.xGqGT-doIWrsQyynv0DVq6YzTDyHpJrYQghX0dgLYe6qNXZ3jhq5QQPKKVFQhY3QwdANnn8Dr_2xbL8WuKZeuA"
```

This sets up did="did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN" and app_did="appid"

- Set up token2
  This is a second token that can be used for testing purposes(eg. when one did user tries to access another did user's vault)

```bash
token2="eyJhbGciOiAiRVMyNTYiLCAidHlwIjogIkpXVCIsICJ2ZXJzaW9uIjogIjEuMCIsICJraWQiOiAiZGlkOmVsYXN0b3M6aWpVbkQ0S2VScGVCVUZtY0VEQ2JoeE1USlJ6VVlDUUNaTSNwcmltYXJ5In0.eyJpc3MiOiJkaWQ6ZWxhc3RvczppalVuRDRLZVJwZUJVRm1jRURDYmh4TVRKUnpVWUNRQ1pNIiwic3ViIjoiQWNjZXNzVG9rZW4iLCJhdWQiOiJkaWQ6ZWxhc3RvczppZTFNNkpKNFpmVHZhYTZONEJ0blJZQzE5OUFncjZpaHptIiwiZXhwIjoyNzUyNzM5NzM2OSwicHJvcHMiOiJ7XCJhcHBEaWRcIjogXCJhcHBpZDJcIiwgXCJ1c2VyRGlkXCI6IFwiZGlkOmVsYXN0b3M6aWo4a3JBVlJKaXRaS0ptY0N1Zm9MSFFqcTdNZWYzWmpUTlwiLCBcIm5vbmNlXCI6IFwiYjdhMDNiZGUtMzkwMy0xMWViLThlM2QtYWNkZTQ4MDAxMTIyXCJ9In0.XLj98LePKgSvb7asOns4tOqauHETaDOSv-L4qkcYxrDOM9f4wrHS13gOV8Zi0v2Vw9p7ynKLRFM7Vt1ijW6-Kg"
```

This sets up did="did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN" and app_did="appid2"

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
      "group_id": {"\$oid": "600727f9239421f76705a817"},
      "friend_did": "did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN"
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
           },
           "sort": {"created": -1}
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

- Set script "get_groups" that gets all the groups the DID user belongs to. As part of the result, only the "\_id" and "name" are returned

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
               "created": "\$params.content_created",
               "nested_obj": {
                 "group_id_inner": "\$params.content",
                 "vault_app_did": {
                   "hello": "\$caller_app_did",
                   "world": "\$params.content"
                 }
               }
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
               "sort": {"created": -1},
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
  NOTE: We are going to allow anonymous access with this script by setting "allowAnonymousUser" to true and "allowAnonymousApp" to true

```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
   {
     "name": "get_file_info",
     "allowAnonymousUser": true,
     "allowAnonymousApp": true,
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
       "group_id": {"\$oid": "600727f9239421f76705a817"},
       "group_created": {
         "$gte": "2021-08-27 00:00:00"
       },
       "content": {
         "hello": {
           "world": "kiran"
         }
       },
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
          "$oid": "600727f9239421f76705a817"
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
  NOTE: This is using $token2 because we're going to test calling a script from a different app. This would work the same way if the script was being called by a different DID user. More specifically, $token2 contains caller_did and caller_app_did so we have to pass in context with target_did(the vault owner's DID) and target_app_did

```bash
caller_did="did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN" # This is the DID of user2
caller_app_did="appid2" # This is the application that's calling the script
target_did="did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN" # This is the DID of user1
target_app_did="appid" # This is the application that's calling the script
```

```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token2" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_group_messages",
      "context": {
        "target_did": "did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN",
        "target_app_did": "appid"
      },
      "params": {
        "group_id": {"\$oid": "600727f9239421f76705a817"}
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
          "$oid": "600727f9239421f76705a817"
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
          "$oid": "600727f9239421f76705a817"
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
       "group_id": {"\$oid": "600727f9239421f76705a817"},
       "old_content": "Old Message",
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
       "group_id": {"\$oid": "600727f9239421f76705a817"},
       "content": {
         "hello": {
           "world": "kiran"
         }
       }
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
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "upload_file",
      "params": {
        "group_id": {"\$oid": "600727f9239421f76705a817"},
        "path": "logging.conf"
      }
    }
EOF
```

Should return something like:

```json
{
  "_status": "OK",
  "upload": {
    "transaction_id": "5fc4b654d3ae60e2286f0ac0"
  }
}
```

Then, call the run_script_upload with the transaction ID to upload the file

```bash
curl -F data=@logging.conf http://localhost:5000/api/v1/scripting/run_script_upload/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb3dfaWQiOiI2MDA3Mjg5ZjIzOTQyMWY3NjcwNWE4ODkiLCJ0YXJnZXRfZGlkIjoiZGlkOmVsYXN0b3M6aWo4a3JBVlJKaXRaS0ptY0N1Zm9MSFFqcTdNZWYzWmpUTiIsInRhcmdldF9hcHBfZGlkIjoiYXBwaWQifQ.1hda7rB22R6Dy35l8Rh7M8y1b03t6BExWzMcSyD6z-g -H "Authorization: token $token" -H "Content-Type: multipart/form-data"
```

Should then upload the file logging.conf to the vault

- Run the script to download
  NOTE: You should first upload a file using upload file API or scripting file API before you're able to download

```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token $token" -H "Content-Type: application/json" -d @- << EOF
   {
     "name": "download_file",
     "params": {
       "group_id": {"\$oid": "600727f9239421f76705a817"},
       "path": "logging.conf"
     }
   }
EOF
```

Should return something like:

```json
{
  "_status": "OK",
  "download": {
    "transaction_id": "5fc4b8ef740754a38ad9fd09"
  }
}
```

Then, call the run_script_download with the transaction ID to download the file

```bash
curl --output downloaded-logging.conf -XPOST http://localhost:5000/api/v1/scripting/run_script_download/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb3dfaWQiOiI2MDA3MjhiOTIzOTQyMWY3NjcwNWE4OTgiLCJ0YXJnZXRfZGlkIjoiZGlkOmVsYXN0b3M6aWo4a3JBVlJKaXRaS0ptY0N1Zm9MSFFqcTdNZWYzWmpUTiIsInRhcmdldF9hcHBfZGlkIjoiYXBwaWQifQ.H68fimGJNyqh047rB_n7S5BMEHCXQ0mY7cSOlU2lBX8 -H "Authorization: token $token"
```

Should then download the file and save it to downloaded-logging.conf file.

- Get both the properties and hash of a file.
  NOTE: This is a script where Anonymous options are set to True so we do not need to pass in an authorization token

```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_file_info",
      "context": {
        "target_did": "did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN",
        "target_app_did": "appid"
      },
      "params": {
        "group_id": {"\$oid": "600727f9239421f76705a817"},
        "path": "logging.conf"
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

### Run scripts using URLs directly

In addition to using /api/v1/scripting/run_script endpoint with POST parameters, you can also run all the scripts directly using a single URL using GET request. The following 2 examples showcase 2 different types of scripts(no parameters passed and parameters passed with nested json). Note that if it's not a nested json, you can directly append the `?key1=value1&key2=value2` to the end of the URL

- Run script "get_groups"

How to encode extra values(that may be JSON objects):

```bash
TARGET_DID="did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN"
TARGET_APP_DID="appid"
```

Run the script directly:

```bash
curl -H "Authorization: token $token" http://localhost:5000/api/v1/scripting/run_script_url/$TARGET_DID@$TARGET_APP_DID/get_groups
```

- Get both the properties and hash of a file.
  NOTE: This is a script where Anonymous options are set to True so we do not need to pass in an authorization token

How to encode extra values(that may be JSON objects):

```bash
TARGET_DID="did:elastos:ij8krAVRJitZKJmcCufoLHQjq7Mef3ZjTN"
TARGET_APP_DID="appid"
params='{ "group_id": {"\$oid": "600727f9239421f76705a817"}, "path": "logging.conf"}'
PARAMS=$(python3 -c "import urllib.parse; print(urllib.parse.urlencode($params))")
```

Run the script directly:

```bash
curl http://localhost:5000/api/v1/scripting/run_script_url/$TARGET_DID@$TARGET_APP_DID/get_file_info?$PARAMS
```
