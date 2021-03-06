'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('poolui', [
	'ngRoute',
	'ngMaterial',
	'md.data.table',
	'angularMoment',
	'ngStorage',
	'ngAudio',
	'utils.strings',
	'utils.services',
	'n3-line-chart',
	'angular-page-visibility'
]).config(['$locationProvider', '$routeProvider', '$mdThemingProvider', function($locationProvider, $routeProvider, $mdThemingProvider) {
	$locationProvider.hashPrefix('');
	// $mdIconProvider.defaultIconSet("https://rawgit.com/angular/material-start/es5-tutorial/app/assets/svg/avatars.svg", 128)
	
	$mdThemingProvider.theme('default')
    .primaryPalette('grey')
    .accentPalette('light-blue');

	$routeProvider
		.when('/home', {
			templateUrl: 'home/home.html',
			controller: 'HomeCtrl',
			activetab: 'home'
		})
		.when('/dashboard', {
			templateUrl: 'dashboard/dashboard.html',
			controller: 'DashboardCtrl',
			activetab: 'dashboard'
		})
		.when('/blocks', {
			templateUrl: 'blocks/blocks.html',
			controller: 'BlocksCtrl',
			activetab: 'blocks'
		})
		.when('/payments', {
			templateUrl: 'payments/payments.html',
			controller: 'PaymentsCtrl',
			activetab: 'payments'
		})
		.when('/network', {
			templateUrl: 'network/network.html',
			controller: 'NetworkCtrl',
			activetab: 'network'
		})
		.when('/help/chat', {
			templateUrl: 'help/chat.html',
			controller: 'ChatCtrl',
			activetab: 'support'
		})
		.when('/help/getting_started', {
			templateUrl: 'help/getting_started.html',
			controller: 'GettingStartedCtrl',
			activetab: 'help'
		})
		.when('/help/faq', {
			templateUrl: 'help/faq.html',
			controller: 'FAQCtrl',
			activetab: 'help'
		});


		$routeProvider.otherwise({redirectTo: '/home'});

	}]);

app.controller('AppCtrl', function($scope, $window, $route, dataService, timerService, addressService, $mdSidenav, $mdMedia, $localStorage, ngAudio){
	var appCache = window.applicationCache;
	$scope.$storage = $localStorage;

	$scope.poolList = ["pplns", "pps", "solo"];
	$scope.poolStats = {}; // All Pool stats
	$scope.addrStats = {}; // All tracked addresses

	$scope.lastBlock = {};
	
	// for miner tracking
	$scope.yourTotalHashRate = 0;

	// Hashrate Alarm
	$scope.globalSiren = false;
	$scope.sirenAudio = ngAudio.load("assets/ding.wav");
	
	// Update global hashrate and set off alarm if any of the tracked addresses fall below the threshold
	var updateHashRate = function (addrStats){
		var totalHashRate = 0;
		var siren = false;
		
		_.each(addrStats, function(addr,index) {
            totalHashRate += addr.hash;
            if (addr.alarm && addr.hash < addr.alarmLimit) {
            	siren=true;
            }
        });

		$scope.globalSiren=siren;
        $scope.yourTotalHashRate = totalHashRate;
	}

	var playSiren = function (){
		($scope.globalSiren) ? $scope.sirenAudio.play() : $scope.sirenAudio.stop();
	}

	var loadData = function () {
		dataService.getData("/pool/stats", function(data){
			$scope.poolList = data.pool_list;
			$scope.poolStats.global = data.pool_statistics;
		});

		dataService.getData("/network/stats", function(data){
			$scope.network = data;
		});	
	}

	var loadOnce = function () {
		dataService.getData("/config", function(data){
			$scope.config = data;
		});
	}

	// Start the timer and register global requests
	timerService.startTimer(5000);
	timerService.register(loadData, 'global');

	// Start address tracking servuce after starting timer, only one callback supported at a time
	addressService.start(function(addrStats) {
			$scope.addrStats = addrStats;
			updateHashRate(addrStats);
			playSiren();
		}
	);

	// ------- UI HELPERS

	$scope.menuOpen = $mdMedia('gt-md');
	$scope.$watch(function() { return $mdMedia('gt-md'); }, function(big) {
    	$scope.menuOpen = $mdMedia('gt-md');
  	});

	$scope.toggleSidenav = function (){
		if (!$mdMedia('gt-md')) {
			$mdSidenav('left').toggle();
		} else {
			// toggle boolean
			$scope.menuOpen = !$scope.menuOpen;
		}
	}

	// ------- App Update

	var update = function() {
		
		if (appCache.status == window.applicationCache.UPDATEREADY) {
			appCache.swapCache();  // The fetch was successful, swap in the new cache.
			$window.location.reload();
		}
	}

	appCache.addEventListener("updateready", function(event) {
		console.log("UpdateReady Event Caught");
		update();
	}, false);

	var updateCache = function () {
		var appCache = window.applicationCache;
		update();
		 // appCache.update(); Attempt to update the user's cache.
	}

	// Start doing things
	loadOnce();
	loadData();
	updateCache();
});