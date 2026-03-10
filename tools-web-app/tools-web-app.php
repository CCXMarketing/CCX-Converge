<?php
/**
 * Plugin Name: CCX Tools App
 * Description: Internal tools application for CCX
 * Version: 0.1.4
 * Author: Cliniconex
 */

if (!defined('ABSPATH')) {
  exit;
}

add_action('wp_enqueue_scripts', function () {
  if (!is_user_logged_in()) return;

  global $post;
  if (!$post || !has_shortcode($post->post_content, 'converge_app')) return;

  wp_enqueue_script(
    'converge-app-js',
    plugin_dir_url(__FILE__) . 'assets/app.js',
    [],
    '0.1.4',
    true
  );

});

add_shortcode('converge_app', function () {
  if (!is_user_logged_in()) {
    return '<p>Access restricted.</p>';
  }

  return '<div id="converge-app"></div>';
});
