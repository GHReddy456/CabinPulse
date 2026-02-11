use jni::objects::{JClass, JString};
use jni::sys::jstring;
use jni::JNIEnv;
use tokio::runtime::Runtime;
use serde_json::json;

use crate::api::vtop_get_client::{
    get_vtop_client,
    vtop_client_login,
    fetch_semesters,
    fetch_timetable,
};

#[no_mangle]
pub extern "system" fn Java_com_ghreddy_facultymate_vtopbridge_VtopBridgeModule_vtopCall(
    mut env: JNIEnv,
    _class: JClass,
    input: JString,
) -> jstring {
    let input_str: String = env.get_string(&input).expect("Couldn't get input").into();
    let json_input: serde_json::Value = serde_json::from_str(&input_str).unwrap_or(json!({}));
    let action = json_input["action"].as_str().unwrap_or("login");

    let runtime = Runtime::new().expect("Couldn't create runtime");
    
    let result = runtime.block_on(async {
        match action {
            "login" => {
                let username = json_input["username"].as_str().unwrap_or("").to_uppercase();
                let password = json_input["password"].as_str().unwrap_or("");
                let mut client = get_vtop_client(username, password.to_string(), None);
                
                // Login with retries
                let mut retry_count = 0;
                let mut login_success = false;
                while retry_count < 3 {
                    match vtop_client_login(&mut client).await {
                        Ok(_) => {
                            login_success = true;
                            break;
                        },
                        Err(_) if retry_count < 2 => {
                            retry_count += 1;
                            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                        }
                        Err(e) => {
                            return json!({
                                "success": false,
                                "error": "Login failed",
                                "details": format!("{:?}", e)
                            });
                        }
                    }
                }

                if !login_success {
                    return json!({"success": false, "error": "Login failed after retries"});
                }

                // Fetch Semesters
                let semesters_data = match fetch_semesters(&mut client).await {
                    Ok(data) => data,
                    Err(e) => return json!({"success": false, "error": "Failed to fetch semesters", "details": format!("{:?}", e)}),
                };

                if semesters_data.semesters.is_empty() {
                    return json!({"success": false, "error": "No semesters found"});
                }

                let semester_id = semesters_data.semesters[0].id.clone();

                // Fetch Timetable
                let timetable = match fetch_timetable(&mut client, semester_id).await {
                    Ok(data) => data,
                    Err(e) => return json!({"success": false, "error": "Failed to fetch timetable", "details": format!("{:?}", e)}),
                };

                // Extract Faculty
                let mut faculty_map = std::collections::HashMap::new();
                for slot in timetable.slots {
                    if !slot.faculty.trim().is_empty() {
                        let cabin_id = if !slot.room_no.trim().is_empty() {
                            slot.room_no
                        } else {
                            format!("UNKNOWN-{}", slot.faculty.replace(' ', "-"))
                        };
                        if !faculty_map.contains_key(&cabin_id) {
                            faculty_map.insert(
                                cabin_id.clone(),
                                json!({
                                    "cabinId": cabin_id,
                                    "name": slot.faculty
                                }),
                            );
                        }
                    }
                }

                json!({
                    "success": true,
                    "faculty": faculty_map.values().collect::<Vec<_>>(),
                    "semesters": semesters_data.semesters.into_iter().map(|s| json!({"id": s.id, "name": s.name})).collect::<Vec<_>>()
                })
            }
            _ => json!({"success": false, "error": format!("Unknown action: {}", action)})
        }
    });

    let output = result.to_string();
    env.new_string(output).expect("Couldn't create java string").into_raw()
}
