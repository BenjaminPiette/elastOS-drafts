- Set subcondition "user_in_group"
```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_subcondition -H "Authorization: token 38b8c2c1093dd0fec383a9d9ac940515" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "user_in_group",
      "condition": {
        "collection": "groups",
        "query": {
          "group_id": "id", 
          "friend_did": "friends"
        }
      }
    }
EOF
```

- Set script "get_group_messages" that gets the last 100 messages for a particular group ID sorted with "created" field in the ascending order
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token 38b8c2c1093dd0fec383a9d9ac940515" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_group_messages",
      "exec_sequence": [
        {
          "endpoint": "db/find_many",
          "name": "messages",
          "query": {
            "group_id": "4aktrab688db87875fddc6Km"
          },
          "options": {
            "limit": 100,
            "sort": [
              "created"
            ],
            "projection": {
              "created": 1,
              "content": 1
            }
          }
        }
      ],
      "condition": {
          "type": "sub"
          "name": "user_in_group"
      }
    }
EOF
```

- Set script "get_groups" that gets all the groups the DID user belongs to. As part of the result, only the "_id" and "name" are returned
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token 38b8c2c1093dd0fec383a9d9ac940515" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_groups",
      "exec_sequence": [
        {
          "type": "db/find_many",
          "name": "groups",
          "query": {
            "did": "did:elastos:iUhndsxcgijret834Hdasdf31Ld"
          },
          "options": {
            "projection": {
              "_id": 1,
              "name": 1
            }
          }
        }
      ]
    }
EOF
```

- Set script "add_group_message" that adds a message to the group messaging. As part of the result, only the recently added content with the fields "created" and "content" are returned
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/set_script -H "Authorization: token 38b8c2c1093dd0fec383a9d9ac940515" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "add_group_message",
      "app_id": "com.hyper.messenger",
      "exec_sequence": [
        {
          "endpoint": "db/insert_one",
          "name": "messages",
          "document": {
            "group_id": "4aktrab688db87875fddc6Km", 
            "friend_did": "did:elastos:iUhndsxcgijret834Hdasdf31Ld",
            "content": "New message"
          },
          "options": {}
        },
        {
          "endpoint": "db/find_one",
          "name": "messages",
          "query": {
            "group_id": "4aktrab688db87875fddc6Km"
          },
          "options": {
            "sort": [
              "-created"
            ],
            "projection": {
              "created": 1,
              "content": 1
            }
          }
        }
      ],
      "condition": {
        "type": "and",
        "conditions": [
            {
                "type": "sub",
                "name": "user_in_group"
            }
        ]
      }
    }
EOF
```

- Run script "get_groups"
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token 38b8c2c1093dd0fec383a9d9ac940515" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_groups"
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
            }
          ]
        }

```

- Run script "add_group_message"
 ```bash
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token 38b8c2c1093dd0fec383a9d9ac940515" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "add_group_message",
      "params": {
        "group_id": "4aktrab688db87875fddc6Km",
        "friend_id": "did:elastos:iUhndsxcgijret834Hdasdf31Ld",
        "group_created": {
          "$gte": "Wed, 25 Feb 1987 17:00:00 GMT"
        }
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
curl -XPOST http://localhost:5000/api/v1/scripting/run_script -H "Authorization: token 38b8c2c1093dd0fec383a9d9ac940515" -H "Content-Type: application/json" -d @- << EOF
    {
      "name": "get_group_messages",
      "params": {
        "group_id": "4aktrab688db87875fddc6Km",
        "friend_did": {
          "$in": ["did:elastos:iUhndsxcgijret834Hdasdf31Ld"]
        }
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